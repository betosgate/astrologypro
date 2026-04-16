/**
 * AWS Chime SIP Media Application (SMA) Lambda Handler
 *
 * Deploy via SAM/CDK with env vars: APP_URL, CRON_SECRET
 *
 * Call flows:
 *   INBOUND:  Client calls Chime number → Pause (hold) → diviner answers → bridge
 *   OUTBOUND: Server dials diviner phone → diviner answers → JoinChimeMeeting → bridge caller
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

// ── Module-level cache for outbound call arguments ──────────────────────────
// Keyed by outbound TransactionId. Entries auto-expire after 5 minutes.
const _outboundArgs = new Map();

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
        "We couldn't find your account. Please book a session online.",
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

  if (args.action === "ring_diviner" && args.meetingId) {
    // Cache args — CALL_ANSWERED will use them to return JoinChimeMeeting,
    // and ACTION_SUCCESSFUL will use them to bridge the caller.
    if (txId) {
      cacheArgs(txId, args);
      console.log("Cached outbound args for txId:", txId);
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

  // Diviner's phone joined the Chime meeting — now bridge the inbound caller
  if (actionType === "JoinChimeMeeting" && direction === "Outbound") {
    const args = txId ? peekArgs(txId) : null;
    if (txId) clearArgs(txId);

    console.log(
      "Diviner joined meeting via phone! Bridging caller...",
      "meetingId:", args?.meetingId,
      "phoneSessionId:", args?.phoneSessionId
    );

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
  const direction =
    event.CallDetails?.Participants?.[0]?.Direction ?? "Unknown";
  const txId = event.CallDetails?.TransactionId;

  console.error(
    "SMA action failed:", JSON.stringify(actionData),
    "direction:", direction, "txId:", txId
  );

  if (txId) clearArgs(txId);

  const callId = event.CallDetails?.Participants?.[0]?.CallId;

  if (direction === "Outbound") {
    console.log("Outbound call to diviner failed — hanging up outbound leg");
    return {
      SchemaVersion: "1.0",
      Actions: [{ Type: "Hangup", Parameters: { SipResponseCode: "480" } }],
    };
  }

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
