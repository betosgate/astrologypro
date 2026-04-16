/**
 * AWS Chime SIP Media Application (SMA) Lambda Handler
 *
 * Receives inbound call events from Chime PSTN and returns SMA actions.
 * Calls back to the Next.js API for business logic (client/booking lookup).
 *
 * Deploy via SAM/CDK with the following env vars:
 *   APP_URL       - AstrologyPro base URL (e.g., https://astrologypro.com)
 *   CRON_SECRET   - Shared secret for authenticating callbacks to the Next.js API
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
  console.log("CRON_SECRET set:", !!CRON_SECRET, "length:", CRON_SECRET.length, "prefix:", CRON_SECRET.slice(0, 16));

  // Call back to Next.js API to look up diviner + client + booking
  try {
    const lookupUrl = `${APP_URL}/api/chime/voice/lookup`;
    console.log("Fetching:", lookupUrl);

    const lookupRes = await fetch(lookupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({
        callerPhone,
        calledNumber,
        callId,
      }),
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
      console.log("Action: enqueue, divinerId:", lookup.divinerId, "phoneSessionId:", lookup.phoneSessionId);

      // Notify diviner via the Next.js API (fire-and-forget)
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
        }),
      }).catch((err) => console.error("Notify fire-and-forget failed:", err?.message));

      // Keep the caller on hold with silence while diviner accepts
      // (PlayAudio removed — S3 hold music not yet uploaded)
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

/**
 * CALL_UPDATE_REQUESTED — triggered by UpdateSipMediaApplicationCall from the accept endpoint.
 * The Arguments contain the Chime meeting info to bridge the caller into.
 */
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

  console.warn("Unknown call update action:", args.action);
  return { SchemaVersion: "1.0", Actions: [] };
}

async function handleActionSuccessful(event) {
  const actionData = event.ActionData;
  const actionType = actionData?.Type;
  const callId = event.CallDetails?.Participants?.[0]?.CallId;

  if (actionType === "JoinChimeMeeting") {
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

async function handleActionFailed(event) {
  console.error("SMA action failed:", JSON.stringify(event.ActionData));
  const callId = event.CallDetails?.Participants?.[0]?.CallId;
  return hangupWithMessage(
    "We're sorry, something went wrong. Please try again.",
    callId
  );
}

async function handleHangup(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const caller = participants.find((p) => p.Direction === "Inbound");

  if (!caller) return { SchemaVersion: "1.0", Actions: [] };

  console.log("HANGUP for callId:", caller.CallId);

  try {
    await fetch(`${APP_URL}/api/chime/voice/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({
        callId: caller.CallId,
        callStatus: "completed",
        durationSeconds: Math.round(
          (Date.now() - new Date(caller.StartTime).getTime()) / 1000
        ),
      }),
    });
  } catch (err) {
    console.error("Failed to notify call status:", err);
  }

  return { SchemaVersion: "1.0", Actions: [] };
}

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
