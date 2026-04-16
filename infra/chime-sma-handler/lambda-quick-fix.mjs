/**
 * AWS Chime SIP Media Application (SMA) Lambda Handler
 *
 * Receives inbound AND outbound call events from Chime PSTN and returns SMA actions.
 * Calls back to the Next.js API for business logic (client/booking lookup).
 *
 * Deploy via SAM/CDK with the following env vars:
 *   APP_URL       - AstrologyPro base URL (e.g., https://astrologypro.com)
 *   CRON_SECRET   - Shared secret for authenticating callbacks to the Next.js API
 *
 * Call flows:
 *   INBOUND: Client calls Chime number → hold with Pause → diviner answers (dashboard or phone)
 *   OUTBOUND: Server dials diviner's phone → diviner answers → join meeting → bridge caller
 *
 * SMA event structure: https://docs.aws.amazon.com/chime-sdk/latest/dg/pstn-invocations.html
 */

const APP_URL = process.env.APP_URL || "https://astrologypro.com";
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function handler(event) {
  console.log("SMA event:", JSON.stringify(event, null, 2));

  const invocationEventType = event.InvocationEventType;

  switch (invocationEventType) {
    case "NEW_INBOUND_CALL":
      return handleNewInboundCall(event);

    case "NEW_OUTBOUND_CALL":
      return handleNewOutboundCall(event);

    case "CALL_UPDATE_REQUESTED":
      return handleCallUpdateRequested(event);

    case "ACTION_SUCCESSFUL":
      return handleActionSuccessful(event);

    case "ACTION_FAILED":
      return handleActionFailed(event);

    case "HANGUP":
      return handleHangup(event);

    default:
      console.log("Unhandled event type:", invocationEventType);
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
  console.log("APP_URL:", APP_URL);

  try {
    const lookupUrl = `${APP_URL}/api/chime/voice/lookup`;
    console.log("Fetching:", lookupUrl);

    const lookupRes = await fetch(lookupUrl, {
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
      console.error("Lookup failed! Status:", lookupRes.status, "Body:", errText);
      return hangupWithMessage(
        "We couldn't find your account. Please book a session online.",
        callId
      );
    }

    const lookup = await lookupRes.json();
    console.log("Lookup result:", JSON.stringify(lookup));

    // Scheduled dial-in: join existing Chime meeting
    if (lookup.action === "join_meeting" && lookup.chimeMeetingId) {
      console.log("Action: join_meeting, meetingId:", lookup.chimeMeetingId);
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
        "Action: enqueue, divinerId:",
        lookup.divinerId,
        "phoneSessionId:",
        lookup.phoneSessionId,
        "answerMode:",
        lookup.phone_answer_mode
      );

      // Notify diviner — this now also creates the meeting & dials their phone
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
          // Pass these so notify can dial diviner's phone
          phoneAnswerMode: lookup.phone_answer_mode ?? "both",
          phoneMobile: lookup.phone_mobile ?? null,
          chimePhoneNumber: calledNumber,
        }),
      }).catch((err) =>
        console.error("Notify fire-and-forget failed:", err?.message)
      );

      // Hold the caller while diviner is being notified
      console.log("Returning Pause action (30s hold)");
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

    // No valid action — reject
    console.error("No valid action from lookup. Got:", lookup.action);
    return hangupWithMessage(
      "We couldn't match your call to a session. Please book online at astrologypro.com.",
      callId
    );
  } catch (err) {
    console.error("SMA lookup error:", err?.message ?? err, err?.stack ?? "");
    return hangupWithMessage(
      "We're experiencing technical difficulties. Please try again later.",
      callId
    );
  }
}

// =============================================================================
// OUTBOUND CALL — We're dialing the diviner's personal phone
// =============================================================================

async function handleNewOutboundCall(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const outbound = participants.find((p) => p.Direction === "Outbound");
  const callId = outbound?.CallId;

  // The ArgumentsMap we passed in CreateSipMediaApplicationCallCommand
  const args = callDetails?.Parameters?.ArgumentsMap ?? {};

  console.log("=== NEW OUTBOUND CALL ===");
  console.log("callId:", callId);
  console.log("to:", outbound?.To);
  console.log("Arguments:", JSON.stringify(args));

  if (args.action === "ring_diviner" && args.meetingId && args.joinToken) {
    // When the diviner answers their phone, join them into the Chime meeting
    // and then bridge the original caller in
    console.log(
      "Will join diviner to meeting:",
      args.meetingId,
      "when they answer"
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

  console.warn("Unknown outbound call action:", args.action);
  return { SchemaVersion: "1.0", Actions: [] };
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
    console.log("Cancelling outbound ring to diviner phone, callId:", callId);
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

  console.log(
    "ACTION_SUCCESSFUL:",
    actionType,
    "direction:",
    direction,
    "callId:",
    callId
  );

  // Diviner answered their phone and joined the Chime meeting
  // Now bridge the original caller into the same meeting
  if (actionType === "JoinChimeMeeting" && direction === "Outbound") {
    const args = callDetails?.Parameters?.ArgumentsMap ?? {};
    console.log(
      "Diviner joined meeting via phone! Bridging caller...",
      "meetingId:",
      args.meetingId
    );

    // Call bridge-caller endpoint to bridge the inbound caller
    if (
      args.inboundTransactionId &&
      args.meetingId &&
      args.callerJoinToken
    ) {
      fetch(`${APP_URL}/api/chime/voice/bridge-caller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({
          phoneSessionId: args.phoneSessionId,
          inboundTransactionId: args.inboundTransactionId,
          meetingId: args.meetingId,
          callerJoinToken: args.callerJoinToken,
          callerAttendeeId: args.callerAttendeeId,
        }),
      }).catch((err) =>
        console.error("Bridge-caller fire-and-forget failed:", err?.message)
      );
    } else {
      console.warn("Missing bridge arguments:", JSON.stringify(args));
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
    console.log("Pause finished, looping another 30s hold for callId:", callId);
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
  console.error(
    "SMA action failed:",
    JSON.stringify(actionData),
    "direction:",
    direction
  );

  const callId = event.CallDetails?.Participants?.[0]?.CallId;

  // If the outbound call to diviner failed (no answer, busy, etc.), just end it
  if (direction === "Outbound") {
    console.log("Outbound call to diviner failed — hanging up outbound leg");
    return { SchemaVersion: "1.0", Actions: [{ Type: "Hangup", Parameters: { SipResponseCode: "480" } }] };
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

  console.log("HANGUP direction:", direction, "callId:", callId);

  // Inbound caller hung up — notify the status endpoint for billing/cleanup
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
            (Date.now() - new Date(participant.StartTime).getTime()) / 1000
          ),
        }),
      });
    } catch (err) {
      console.error("Failed to notify call status:", err);
    }
  }

  // Outbound call to diviner hung up (they declined or didn't answer)
  if (direction === "Outbound") {
    console.log("Outbound call to diviner ended (declined or no answer)");
    // The inbound caller is still on hold — they can still be answered from dashboard
  }

  return { SchemaVersion: "1.0", Actions: [] };
}

// =============================================================================
// Helpers
// =============================================================================

function hangupWithMessage(message, callId) {
  console.log("hangupWithMessage:", message, "callId:", callId ?? "none");
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
