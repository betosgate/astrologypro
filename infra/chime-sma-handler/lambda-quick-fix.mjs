/**
 * AWS Chime SIP Media Application (SMA) Lambda Handler
 *
 * Deploy via SAM/CDK with env vars: APP_URL, CRON_SECRET, CENTRAL_NUMBERS
 *
 *   CENTRAL_NUMBERS — comma-separated E.164 list of shared-inbox numbers
 *                     that should prompt the caller for a 6-digit PIN
 *                     (e.g. "+12162206209"). Any calledNumber NOT in this
 *                     list falls back to the legacy per-diviner routing.
 *
 * Call flows:
 *   INBOUND (per-diviner): Client calls diviner's Chime number → Pause (hold)
 *                          → diviner answers → bridge
 *   INBOUND (central+PIN): Client calls central number → SpeakAndGetDigits
 *                          → lookup by PIN → join_meeting OR Pause+notify
 *   OUTBOUND: Server dials diviner phone → diviner answers → JoinChimeMeeting
 *             → bridge caller
 *
 * IMPORTANT — Event argument paths:
 *   NEW_OUTBOUND_CALL:     event.ActionData.Parameters.Arguments
 *   CALL_UPDATE_REQUESTED: event.ActionData.Parameters.Arguments
 *   RINGING / CALL_ANSWERED / ACTION_SUCCESSFUL: NO arguments in event
 *
 * Strategy: Cache outbound arguments in NEW_OUTBOUND_CALL, use them in
 * CALL_ANSWERED (to return JoinChimeMeeting) and ACTION_SUCCESSFUL (to bridge caller).
 * JoinChimeMeeting MUST be returned in CALL_ANSWERED, not NEW_OUTBOUND_CALL —
 * the SMA cannot execute meeting joins until the phone call is connected.
 */

const APP_URL = process.env.APP_URL || "https://astrologypro.com";
const CRON_SECRET = process.env.CRON_SECRET || "";

// ── Central (shared-inbox) numbers that require PIN entry ───────────────────
// Parse "+12162206209,+18884949856" → Set(["+12162206209", "+18884949856"]).
const CENTRAL_NUMBERS = new Set(
  (process.env.CENTRAL_NUMBERS || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
);

const MAX_PIN_ATTEMPTS = 3;

// ── Module-level cache for outbound call arguments ──────────────────────────
// Keyed by outbound TransactionId. Entries auto-expire after 5 minutes.
const _outboundArgs = new Map();

// ── Module-level cache for inbound caller metadata across IVR turns ─────────
// Keyed by inbound CallId. Stores { callerPhone, calledNumber, ts, attempts }.
// We need this because SpeakAndGetDigits returns the digits in ACTION_SUCCESSFUL
// but NOT the original caller's From/To — we have to remember them.
const _pinSessions = new Map();

function cacheArgs(txId, args) {
  _outboundArgs.set(txId, { args, ts: Date.now() });
  // Purge stale entries (> 5 min)
  for (const [k, v] of _outboundArgs) {
    if (Date.now() - v.ts > 300_000) _outboundArgs.delete(k);
  }
}

/** Read without deleting — we need args in both CALL_ANSWERED and ACTION_SUCCESSFUL */
function peekArgs(txId) {
  const entry = _outboundArgs.get(txId);
  return entry?.args ?? null;
}

function clearArgs(txId) {
  _outboundArgs.delete(txId);
}

// ── PIN session helpers ─────────────────────────────────────────────────────

function rememberPinSession(callId, callerPhone, calledNumber) {
  _pinSessions.set(callId, {
    callerPhone,
    calledNumber,
    ts: Date.now(),
    attempts: 0,
  });
  // Purge stale entries (> 5 min)
  for (const [k, v] of _pinSessions) {
    if (Date.now() - v.ts > 300_000) _pinSessions.delete(k);
  }
}

function peekPinSession(callId) {
  return _pinSessions.get(callId) ?? null;
}

function bumpPinAttempts(callId) {
  const entry = _pinSessions.get(callId);
  if (!entry) return 0;
  entry.attempts += 1;
  entry.ts = Date.now();
  return entry.attempts;
}

function clearPinSession(callId) {
  _pinSessions.delete(callId);
}

/** Build a SpeakAndGetDigits action that prompts for a 6-digit PIN. */
function speakAndGetPin(callId, promptText) {
  return {
    Type: "SpeakAndGetDigits",
    Parameters: {
      CallId: callId,
      InputDigitsRegex: "^\\d{6}$",
      MinNumberOfDigits: 6,
      MaxNumberOfDigits: 6,
      Repeat: 1,
      InBetweenDigitsDurationInMilliseconds: 5000,
      RepeatDurationInMilliseconds: 10000,
      TerminatorDigits: ["#"],
      SpeechParameters: {
        Text: promptText,
        Engine: "neural",
        LanguageCode: "en-US",
        VoiceId: "Joanna",
      },
      FailureSpeechParameters: {
        Text: "We didn't get that. Please enter your six digit booking PIN.",
        Engine: "neural",
        LanguageCode: "en-US",
        VoiceId: "Joanna",
      },
    },
  };
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function handler(event) {
  console.log("SMA event:", JSON.stringify(event, null, 2));

  switch (event.InvocationEventType) {
    case "NEW_INBOUND_CALL":
      return handleNewInboundCall(event);

    case "NEW_OUTBOUND_CALL":
      return handleNewOutboundCall(event);

    case "RINGING":
      console.log("RINGING — no action needed");
      return { SchemaVersion: "1.0", Actions: [] };

    case "CALL_ANSWERED":
      return handleCallAnswered(event);

    case "CALL_UPDATE_REQUESTED":
      return handleCallUpdateRequested(event);

    case "ACTION_SUCCESSFUL":
      return handleActionSuccessful(event);

    case "ACTION_FAILED":
      return handleActionFailed(event);

    case "HANGUP":
      return handleHangup(event);

    default:
      console.log("Unhandled event type:", event.InvocationEventType);
      return { SchemaVersion: "1.0", Actions: [] };
  }
}

// =============================================================================
// INBOUND CALL — Client calling the diviner's Chime number
// =============================================================================

async function handleNewInboundCall(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const caller = participants.find((p) => p.Direction === "Inbound");

  if (!caller) {
    console.error("No inbound caller found in participants");
    return hangupWithMessage("Unable to process your call. Please try again.");
  }

  const callerPhone = caller.From;
  const calledNumber = caller.To;
  const callId = caller.CallId;

  console.log("=== NEW INBOUND CALL ===");
  console.log("callerPhone:", callerPhone);
  console.log("calledNumber:", calledNumber);
  console.log("callId:", callId);

  // ── Central number? Prompt for PIN instead of per-diviner lookup ─────
  if (CENTRAL_NUMBERS.has(calledNumber)) {
    console.log("Central number detected — prompting for PIN");
    rememberPinSession(callId, callerPhone, calledNumber);
    return {
      SchemaVersion: "1.0",
      Actions: [
        speakAndGetPin(
          callId,
          "Welcome to Astrology Pro. Please enter your six digit booking PIN, followed by the pound key."
        ),
      ],
    };
  }

  try {
    const lookupRes = await fetch(`${APP_URL}/api/chime/voice/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ callerPhone, calledNumber, callId }),
    });

    console.log("Lookup response status:", lookupRes.status);

    if (!lookupRes.ok) {
      const errText = await lookupRes.text();
      console.error("Lookup failed:", lookupRes.status, errText);
      return hangupWithMessage(
        "We couldn't match your phone number to an upcoming booking. Please book a session online before calling.",
        callId
      );
    }

    const lookup = await lookupRes.json();
    console.log("Lookup result:", JSON.stringify(lookup));

    // Scheduled dial-in: join existing Chime meeting
    if (lookup.action === "join_meeting" && lookup.chimeMeetingId) {
      return {
        SchemaVersion: "1.0",
        Actions: [
          {
            Type: "JoinChimeMeeting",
            Parameters: {
              JoinToken: lookup.joinToken,
              CallId: callId,
              MeetingId: lookup.chimeMeetingId,
            },
          },
        ],
      };
    }

    // Standalone call: hold caller while notifying diviner
    if (lookup.action === "enqueue") {
      console.log(
        "Enqueue: divinerId:", lookup.divinerId,
        "phoneSessionId:", lookup.phoneSessionId,
        "answerMode:", lookup.phone_answer_mode
      );

      // Notify diviner (fire-and-forget — must return Pause quickly)
      const transactionId = callDetails?.TransactionId;
      fetch(`${APP_URL}/api/chime/voice/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({
          divinerId: lookup.divinerId,
          phoneSessionId: lookup.phoneSessionId,
          callerPhone,
          callId,
          transactionId,
          phoneAnswerMode: lookup.phone_answer_mode ?? "both",
          phoneMobile: lookup.phone_mobile ?? null,
          chimePhoneNumber: calledNumber,
        }),
      }).catch((err) =>
        console.error("Notify fire-and-forget failed:", err?.message)
      );

      // Hold caller
      return {
        SchemaVersion: "1.0",
        Actions: [
          {
            Type: "Pause",
            Parameters: {
              CallId: callId,
              DurationInMilliseconds: 30000,
            },
          },
        ],
      };
    }

    console.error("No valid action from lookup:", lookup.action);
    return hangupWithMessage(
      "We couldn't match your call to a session. Please book online.",
      callId
    );
  } catch (err) {
    console.error("SMA lookup error:", err?.message ?? err);
    return hangupWithMessage(
      "We're experiencing technical difficulties. Please try again later.",
      callId
    );
  }
}

// =============================================================================
// PIN ENTERED — Caller on a central number completed SpeakAndGetDigits
// Dispatches on the 4 lookup response shapes:
//   join_meeting        → JoinChimeMeeting
//   enqueue             → fire-and-forget notify + Pause (hold)
//   play_and_retry_pin  → Speak + SpeakAndGetDigits again (cap at MAX_PIN_ATTEMPTS)
//   play_and_hangup     → Speak + Hangup
// =============================================================================

async function handlePinEntered(event) {
  const actionData = event.ActionData;
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const inbound = participants.find((p) => p.Direction === "Inbound");
  const callId = inbound?.CallId;
  const digits = actionData?.ReceivedDigits ?? "";

  console.log("=== PIN ENTERED ===");
  console.log("callId:", callId, "digits:", digits);

  const session = callId ? peekPinSession(callId) : null;
  if (!session) {
    console.warn("No PIN session found for callId:", callId);
    return hangupWithMessage(
      "We're sorry, something went wrong. Please try again.",
      callId
    );
  }

  try {
    const lookupRes = await fetch(`${APP_URL}/api/chime/voice/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({
        callPin: digits,
        callerPhone: session.callerPhone,
        callId,
      }),
    });

    if (!lookupRes.ok) {
      console.error("PIN lookup failed:", lookupRes.status, await lookupRes.text());
      clearPinSession(callId);
      return hangupWithMessage(
        "We're experiencing technical difficulties. Please try again later.",
        callId
      );
    }

    const lookup = await lookupRes.json();
    console.log("PIN lookup result:", JSON.stringify(lookup));

    // ─── join_meeting ──────────────────────────────────────────────
    if (lookup.action === "join_meeting" && lookup.chimeMeetingId) {
      clearPinSession(callId);
      return {
        SchemaVersion: "1.0",
        Actions: [
          {
            Type: "JoinChimeMeeting",
            Parameters: {
              JoinToken: lookup.joinToken,
              CallId: callId,
              MeetingId: lookup.chimeMeetingId,
            },
          },
        ],
      };
    }

    // ─── enqueue ───────────────────────────────────────────────────
    if (lookup.action === "enqueue") {
      clearPinSession(callId);
      console.log(
        "PIN enqueue: divinerId:", lookup.divinerId,
        "phoneSessionId:", lookup.phoneSessionId,
        "answerMode:", lookup.phone_answer_mode
      );

      const transactionId = callDetails?.TransactionId;
      fetch(`${APP_URL}/api/chime/voice/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({
          divinerId: lookup.divinerId,
          phoneSessionId: lookup.phoneSessionId,
          callerPhone: session.callerPhone,
          callId,
          transactionId,
          phoneAnswerMode: lookup.phone_answer_mode ?? "both",
          phoneMobile: lookup.phone_mobile ?? null,
          chimePhoneNumber: session.calledNumber,
        }),
      }).catch((err) =>
        console.error("Notify fire-and-forget failed:", err?.message)
      );

      return {
        SchemaVersion: "1.0",
        Actions: [
          {
            Type: "Pause",
            Parameters: {
              CallId: callId,
              DurationInMilliseconds: 30000,
            },
          },
        ],
      };
    }

    // ─── play_and_retry_pin ────────────────────────────────────────
    if (lookup.action === "play_and_retry_pin") {
      const attempts = bumpPinAttempts(callId);
      if (attempts >= MAX_PIN_ATTEMPTS) {
        console.log("PIN retry cap reached:", attempts);
        clearPinSession(callId);
        return hangupWithMessage(
          "We could not verify your PIN after multiple attempts. Please check your booking confirmation and try again.",
          callId
        );
      }
      const prompt = `${lookup.message ?? "Incorrect PIN, please try again."} Please enter your six digit PIN, followed by the pound key.`;
      return {
        SchemaVersion: "1.0",
        Actions: [speakAndGetPin(callId, prompt)],
      };
    }

    // ─── play_and_hangup ───────────────────────────────────────────
    if (lookup.action === "play_and_hangup") {
      clearPinSession(callId);
      return hangupWithMessage(
        lookup.message ?? "This booking cannot be connected. Please book online.",
        callId
      );
    }

    // Unknown action
    console.error("Unknown PIN lookup action:", lookup.action);
    clearPinSession(callId);
    return hangupWithMessage(
      "We couldn't process your request. Please book online and try again.",
      callId
    );
  } catch (err) {
    console.error("PIN lookup error:", err?.message ?? err);
    clearPinSession(callId);
    return hangupWithMessage(
      "We're experiencing technical difficulties. Please try again later.",
      callId
    );
  }
}

// =============================================================================
// OUTBOUND CALL — We're dialing the diviner's personal phone
// Cache the arguments for later use in CALL_ANSWERED and ACTION_SUCCESSFUL.
// Do NOT return JoinChimeMeeting here — the call isn't connected yet.
// =============================================================================

async function handleNewOutboundCall(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const outbound = participants.find((p) => p.Direction === "Outbound");
  const callId = outbound?.CallId;
  const txId = callDetails?.TransactionId;

  // Arguments are in ActionData.Parameters.Arguments for outbound calls
  const args = event.ActionData?.Parameters?.Arguments ?? {};

  console.log("=== NEW OUTBOUND CALL ===");
  console.log("callId:", callId, "txId:", txId, "to:", outbound?.To);
  console.log("Arguments:", JSON.stringify(args));

  // ring_diviner         — simultaneous-ring: Chime dials the diviner's
  //                         personal phone. On CALL_ANSWERED we JoinChimeMeeting,
  //                         on ACTION_SUCCESSFUL we bridge the inbound caller.
  // dial_client_for_booking — diviner-initiated outbound: Chime dials the
  //                         client's PSTN for a booking. On CALL_ANSWERED we
  //                         JoinChimeMeeting so the client's phone joins the
  //                         meeting the diviner's browser is already in.
  //                         There is no inbound caller to bridge.
  if (
    (args.action === "ring_diviner" ||
      args.action === "dial_client_for_booking") &&
    args.meetingId
  ) {
    // Cache args — CALL_ANSWERED will use them to return JoinChimeMeeting,
    // and ACTION_SUCCESSFUL will use them (for ring_diviner only) to bridge
    // the caller.
    if (txId) {
      cacheArgs(txId, args);
      console.log(
        "Cached outbound args for txId:",
        txId,
        "action:",
        args.action
      );
    }

    // Return empty — phone is still ringing, can't join meeting yet.
    // JoinChimeMeeting will be returned in CALL_ANSWERED.
    console.log("Outbound call initiated, waiting for CALL_ANSWERED");
    return { SchemaVersion: "1.0", Actions: [] };
  }

  console.warn("Unknown outbound call action:", args.action);
  return { SchemaVersion: "1.0", Actions: [] };
}

// =============================================================================
// CALL_ANSWERED — Diviner picked up their personal phone
// NOW we can return JoinChimeMeeting to join them into the Chime meeting.
// =============================================================================

async function handleCallAnswered(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const participant = participants[0];
  const callId = participant?.CallId;
  const direction = participant?.Direction;
  const txId = callDetails?.TransactionId;

  console.log("=== CALL_ANSWERED ===");
  console.log("callId:", callId, "direction:", direction, "txId:", txId);

  // Only handle outbound calls (diviner answering their phone)
  if (direction !== "Outbound" || !txId) {
    return { SchemaVersion: "1.0", Actions: [] };
  }

  const args = peekArgs(txId);
  if (!args || !args.meetingId || !args.joinToken) {
    console.error("No cached args for txId:", txId, "args:", JSON.stringify(args));
    return { SchemaVersion: "1.0", Actions: [] };
  }

  console.log(
    "Diviner answered! Joining them to meeting:", args.meetingId,
    "joinToken length:", args.joinToken?.length
  );

  return {
    SchemaVersion: "1.0",
    Actions: [
      {
        Type: "JoinChimeMeeting",
        Parameters: {
          JoinToken: args.joinToken,
          CallId: callId,
          MeetingId: args.meetingId,
        },
      },
    ],
  };
}

// =============================================================================
// CALL_UPDATE_REQUESTED — triggered by UpdateSipMediaApplicationCall
// =============================================================================

async function handleCallUpdateRequested(event) {
  const args = event.ActionData?.Parameters?.Arguments ?? {};
  const callId = event.CallDetails?.Participants?.[0]?.CallId;

  console.log("=== CALL_UPDATE_REQUESTED ===");
  console.log("Arguments:", JSON.stringify(args));
  console.log("callId:", callId);

  if (args.action === "join_meeting" && args.meetingId && args.joinToken) {
    console.log("Bridging caller into meeting:", args.meetingId);
    return {
      SchemaVersion: "1.0",
      Actions: [
        {
          Type: "JoinChimeMeeting",
          Parameters: {
            JoinToken: args.joinToken,
            CallId: callId,
            MeetingId: args.meetingId,
          },
        },
      ],
    };
  }

  // Diviner answered from dashboard — cancel the outbound ring to their phone
  if (args.action === "cancel_ring") {
    console.log("Cancelling outbound ring to diviner phone");
    return {
      SchemaVersion: "1.0",
      Actions: [{ Type: "Hangup", Parameters: { SipResponseCode: "480" } }],
    };
  }

  console.warn("Unknown call update action:", args.action);
  return { SchemaVersion: "1.0", Actions: [] };
}

// =============================================================================
// ACTION_SUCCESSFUL
// =============================================================================

async function handleActionSuccessful(event) {
  const actionData = event.ActionData;
  const actionType = actionData?.Type;
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const participant = participants[0];
  const callId = participant?.CallId;
  const direction = participant?.Direction;
  const txId = callDetails?.TransactionId;

  console.log(
    "ACTION_SUCCESSFUL:", actionType,
    "direction:", direction,
    "callId:", callId,
    "txId:", txId
  );

  // ── Caller finished entering PIN on central number ─────────────────
  if (actionType === "SpeakAndGetDigits" && direction === "Inbound") {
    return handlePinEntered(event);
  }

  // Outbound leg joined the Chime meeting.
  //
  // Two distinct flows land here:
  //   1. ring_diviner           — the diviner's personal phone joined. We now
  //                               need to bridge the original inbound caller
  //                               into the same meeting (via bridge-caller).
  //   2. dial_client_for_booking — the client's phone joined. There is no
  //                               inbound caller to bridge — the diviner's
  //                               browser attendee was already created by
  //                               /api/chime/voice/call-client. Just log and
  //                               clear the cached args.
  if (actionType === "JoinChimeMeeting" && direction === "Outbound") {
    const args = txId ? peekArgs(txId) : null;
    if (txId) clearArgs(txId);

    console.log(
      "Outbound leg joined meeting.",
      "action:", args?.action,
      "meetingId:", args?.meetingId,
      "phoneSessionId:", args?.phoneSessionId
    );

    // Diviner-initiated outbound call to client — no bridge needed.
    if (args?.action === "dial_client_for_booking") {
      console.log(
        "dial_client_for_booking: client phone joined meeting; no bridge needed."
      );
      return { SchemaVersion: "1.0", Actions: [] };
    }

    // Legacy simultaneous-ring: bridge the inbound caller into the meeting.
    // Call bridge-caller endpoint (looks up everything from DB).
    // MUST await — Lambda freezes context on return.
    if (args?.meetingId && args?.phoneSessionId) {
      try {
        const bridgeRes = await fetch(`${APP_URL}/api/chime/voice/bridge-caller`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CRON_SECRET}`,
          },
          body: JSON.stringify({
            phoneSessionId: args.phoneSessionId,
            meetingId: args.meetingId,
          }),
        });
        const bridgeBody = await bridgeRes.text();
        console.log("Bridge-caller response:", bridgeRes.status, bridgeBody);
      } catch (err) {
        console.error("Bridge-caller failed:", err?.message);
      }
    } else {
      console.warn("Missing args for bridge! cached:", JSON.stringify(args));
    }

    return { SchemaVersion: "1.0", Actions: [] };
  }

  // Inbound caller joined meeting successfully
  if (actionType === "JoinChimeMeeting" && direction === "Inbound") {
    console.log("Caller successfully joined Chime meeting");
    return { SchemaVersion: "1.0", Actions: [] };
  }

  // Pause finished — loop another 30s pause to keep caller on hold
  if (actionType === "Pause") {
    console.log("Pause finished, looping hold for callId:", callId);
    return {
      SchemaVersion: "1.0",
      Actions: [
        {
          Type: "Pause",
          Parameters: {
            CallId: callId,
            DurationInMilliseconds: 30000,
          },
        },
      ],
    };
  }

  return { SchemaVersion: "1.0", Actions: [] };
}

// =============================================================================
// ACTION_FAILED
// =============================================================================

async function handleActionFailed(event) {
  const actionData = event.ActionData;
  const actionType = actionData?.Type;
  const direction =
    event.CallDetails?.Participants?.[0]?.Direction ?? "Unknown";
  const txId = event.CallDetails?.TransactionId;
  const callId = event.CallDetails?.Participants?.[0]?.CallId;

  console.error(
    "SMA action failed:", JSON.stringify(actionData),
    "direction:", direction, "txId:", txId
  );

  if (txId) clearArgs(txId);

  // SpeakAndGetDigits failed (timeout / no input / bad regex) on a central
  // number — retry up to MAX_PIN_ATTEMPTS then hang up politely.
  if (actionType === "SpeakAndGetDigits" && direction === "Inbound" && callId) {
    const session = peekPinSession(callId);
    if (session) {
      const attempts = bumpPinAttempts(callId);
      if (attempts >= MAX_PIN_ATTEMPTS) {
        console.log("PIN retry cap reached after input failure:", attempts);
        clearPinSession(callId);
        return hangupWithMessage(
          "We could not verify your PIN after multiple attempts. Please check your booking confirmation and try again.",
          callId
        );
      }
      return {
        SchemaVersion: "1.0",
        Actions: [
          speakAndGetPin(
            callId,
            "We didn't get your PIN. Please enter your six digit booking PIN, followed by the pound key."
          ),
        ],
      };
    }
  }

  if (direction === "Outbound") {
    console.log("Outbound call to diviner failed — hanging up outbound leg");
    return {
      SchemaVersion: "1.0",
      Actions: [{ Type: "Hangup", Parameters: { SipResponseCode: "480" } }],
    };
  }

  if (callId) clearPinSession(callId);

  return hangupWithMessage(
    "We're sorry, something went wrong. Please try again.",
    callId
  );
}

// =============================================================================
// HANGUP
// =============================================================================

async function handleHangup(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const participant = participants[0];

  if (!participant) return { SchemaVersion: "1.0", Actions: [] };

  const direction = participant.Direction;
  const callId = participant.CallId;
  const txId = callDetails?.TransactionId;

  console.log("HANGUP direction:", direction, "callId:", callId);

  if (direction === "Inbound") {
    if (callId) clearPinSession(callId);
    try {
      await fetch(`${APP_URL}/api/chime/voice/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({
          callId,
          callStatus: "completed",
          durationSeconds: Math.round(
            (Date.now() -
              Number(participant.StartTimeInMilliseconds || Date.now())) /
              1000
          ),
        }),
      });
    } catch (err) {
      console.error("Failed to notify call status:", err);
    }
  }

  if (direction === "Outbound") {
    if (txId) clearArgs(txId);
    console.log("Outbound call to diviner ended");
  }

  return { SchemaVersion: "1.0", Actions: [] };
}

// =============================================================================
// Helpers
// =============================================================================

function hangupWithMessage(message, callId) {
  const actions = [];
  if (callId) {
    actions.push({
      Type: "Speak",
      Parameters: {
        CallId: callId,
        Text: message,
        Engine: "neural",
        LanguageCode: "en-US",
        VoiceId: "Joanna",
      },
    });
  }
  actions.push({ Type: "Hangup", Parameters: { SipResponseCode: "480" } });
  return { SchemaVersion: "1.0", Actions: actions };
}
