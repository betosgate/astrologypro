/**
 * AWS Chime SIP Media Application (SMA) Lambda Handler
 *
 * Receives inbound call events from Chime PSTN and returns SMA actions.
 * Calls back to the Next.js API for business logic (client/booking lookup).
 *
 * Deploy via SAM/CDK with the following env vars:
 *   APP_URL                 - AstrologyPro base URL (e.g., https://astrologypro.com)
 *   CRON_SECRET             - Shared secret for authenticating callbacks to the Next.js API
 *   HOLD_MUSIC_BUCKET       - S3 bucket containing hold-music.wav (default: astropro-assets)
 *   CHIME_RECORDING_BUCKET  - S3 bucket for voicemail recordings (default: astrologypro-chime-recordings)
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
    return hangupWithMessage("Unable to process your call. Please try again.");
  }

  const callerPhone = caller.From;
  const calledNumber = caller.To;
  const callId = caller.CallId;

  // Call back to Next.js API to look up diviner + client + booking
  try {
    const lookupUrl = `${APP_URL}/api/chime/voice/lookup`;
    console.log("Calling lookup:", lookupUrl, "callerPhone:", callerPhone, "calledNumber:", calledNumber, "callId:", callId);
    console.log("CRON_SECRET set:", !!CRON_SECRET, "length:", CRON_SECRET.length, "prefix:", CRON_SECRET.slice(0, 16));

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
      console.error("Lookup failed:", lookupRes.status, errText);
      return hangupWithMessage(
        "We couldn't find your account. Please book a session online."
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

    // Standalone call: client has card on file — route based on diviner's answer mode
    if (lookup.action === "enqueue") {
      const { phone_answer_mode, phone_mobile, divinerId, phoneSessionId } = lookup;

      // P1: Mobile or Both mode — bridge the call to the diviner's actual mobile phone
      if (
        (phone_answer_mode === "mobile" || phone_answer_mode === "both") &&
        phone_mobile
      ) {
        // Notify diviner via dashboard (fire-and-forget — still useful for "both" mode)
        fetch(`${APP_URL}/api/chime/voice/notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CRON_SECRET}`,
          },
          body: JSON.stringify({
            divinerId,
            phoneSessionId,
            callerPhone,
            callId,
          }),
        }).catch(() => {});

        // Build actions: for "both" mode, play a brief announcement before bridging
        const actions = [];

        if (phone_answer_mode === "both") {
          actions.push({
            Type: "Speak",
            Parameters: {
              CallId: callId,
              Text: "Connecting you to your reader. Please hold.",
              Engine: "Neural",
              LanguageCode: "en-US",
              VoiceId: "Joanna",
            },
          });
        }

        actions.push({
          Type: "CallAndBridge",
          Parameters: {
            CallTimeoutSeconds: 30,
            // Show the diviner's Chime DID as caller ID so they see their business number
            CallerIdNumber: calledNumber,
            Endpoints: [
              {
                Uri: phone_mobile,
                BridgeEndpointType: "PSTN",
              },
            ],
          },
        });

        return { SchemaVersion: "1.0", Actions: actions };
      }

      // Browser mode (or mobile/both without a phone_mobile configured):
      // play hold music and notify the diviner's dashboard widget to answer
      fetch(`${APP_URL}/api/chime/voice/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({
          divinerId,
          phoneSessionId,
          callerPhone,
          callId,
        }),
      }).catch(() => {});

      return {
        SchemaVersion: "1.0",
        Actions: [
          {
            Type: "PlayAudio",
            Parameters: {
              CallId: callId,
              AudioSource: {
                Type: "S3",
                BucketName: process.env.HOLD_MUSIC_BUCKET || "astropro-assets",
                Key: "audio/hold-music.wav",
              },
            },
          },
          {
            Type: "Pause",
            Parameters: {
              CallId: callId,
              DurationInMilliseconds: 30000, // 30 seconds of hold music loop
            },
          },
        ],
      };
    }

    // No valid action — reject
    return hangupWithMessage(
      "We couldn't match your call to a session. Please book online at astrologypro.com."
    );
  } catch (err) {
    console.error("SMA lookup error:", err?.message ?? err, err?.stack ?? "");
    return hangupWithMessage(
      "We're experiencing technical difficulties. Please try again later."
    );
  }
}

async function handleActionSuccessful(event) {
  const actionData = event.ActionData;
  const actionType = actionData?.Type;
  const callId = event.CallDetails?.Participants?.[0]?.CallId;
  const transactionId = event.CallDetails?.TransactionId;

  // If JoinChimeMeeting succeeded, the call is now in the meeting
  if (actionType === "JoinChimeMeeting") {
    console.log("Caller successfully joined Chime meeting");
    return { SchemaVersion: "1.0", Actions: [] };
  }

  // If CallAndBridge succeeded, the call was connected to the diviner's mobile
  if (actionType === "CallAndBridge") {
    console.log("CallAndBridge succeeded — call connected to diviner mobile");
    return { SchemaVersion: "1.0", Actions: [] };
  }

  // P2: RecordAudio succeeded — voicemail was recorded. Notify Next.js to persist it.
  if (actionType === "RecordAudio") {
    const recordingKey = actionData?.RecordingDestination?.Key;
    const callerFrom = event.CallDetails?.Participants?.[0]?.From;

    console.log("Voicemail recorded:", recordingKey);

    if (recordingKey) {
      try {
        await fetch(`${APP_URL}/api/chime/voice/voicemail`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-secret": CRON_SECRET,
          },
          body: JSON.stringify({
            transactionId,
            recordingKey,
            callerId: callerFrom,
          }),
        });
      } catch (err) {
        console.error("Failed to persist voicemail:", err);
      }
    }

    // Hang up gracefully after recording completes
    return {
      SchemaVersion: "1.0",
      Actions: [
        {
          Type: "Speak",
          Parameters: {
            CallId: callId,
            Text: "Thank you. Your message has been recorded. Goodbye.",
            Engine: "Neural",
            LanguageCode: "en-US",
            VoiceId: "Joanna",
          },
        },
        {
          Type: "Hangup",
          Parameters: { CallId: callId, SipResponseCode: "0" },
        },
      ],
    };
  }

  // If PlayAudio finished (hold music ended), loop it
  if (actionType === "PlayAudio") {
    if (callId) {
      return {
        SchemaVersion: "1.0",
        Actions: [
          {
            Type: "PlayAudio",
            Parameters: {
              CallId: callId,
              AudioSource: {
                Type: "S3",
                BucketName:
                  process.env.HOLD_MUSIC_BUCKET || "astropro-assets",
                Key: "audio/hold-music.wav",
              },
            },
          },
        ],
      };
    }
  }

  return { SchemaVersion: "1.0", Actions: [] };
}

async function handleActionFailed(event) {
  console.error("SMA action failed:", JSON.stringify(event.ActionData));

  const failedActionType = event.ActionData?.Type;
  const callId = event.CallDetails?.Participants?.[0]?.CallId;
  const transactionId = event.CallDetails?.TransactionId;

  // P2: CallAndBridge timed out or failed — diviner didn't answer their mobile.
  // Offer the caller the option to leave a voicemail.
  if (failedActionType === "CallAndBridge") {
    console.log("CallAndBridge failed — falling back to voicemail prompt");

    return {
      SchemaVersion: "1.0",
      Actions: [
        {
          Type: "Speak",
          Parameters: {
            CallId: callId,
            Text: "Your reader is currently unavailable. Please leave a message after the tone and they will call you back.",
            Engine: "Neural",
            LanguageCode: "en-US",
            VoiceId: "Joanna",
          },
        },
        {
          Type: "Pause",
          Parameters: { CallId: callId, DurationInMilliseconds: 1000 },
        },
        {
          Type: "RecordAudio",
          Parameters: {
            CallId: callId,
            DurationInSeconds: 120,
            SilenceDurationInSeconds: 5,
            SilenceThreshold: 100,
            RecordingTerminators: ["#"],
            RecordingDestination: {
              Type: "S3",
              BucketName:
                process.env.CHIME_RECORDING_BUCKET ||
                "astrologypro-chime-recordings",
              Prefix: `voicemails/${transactionId}/`,
            },
          },
        },
      ],
    };
  }

  // All other failures — hang up gracefully
  return {
    SchemaVersion: "1.0",
    Actions: [
      {
        Type: "Speak",
        Parameters: {
          CallId: callId,
          Text: "We're sorry, we could not complete your call. Please try again later.",
          Engine: "Neural",
          LanguageCode: "en-US",
          VoiceId: "Joanna",
        },
      },
      { Type: "Hangup", Parameters: { CallId: callId, SipResponseCode: "0" } },
    ],
  };
}

async function handleHangup(event) {
  const callDetails = event.CallDetails;
  const participants = callDetails?.Participants ?? [];
  const caller = participants.find((p) => p.Direction === "Inbound");

  if (!caller) return { SchemaVersion: "1.0", Actions: [] };

  // Notify the Next.js API that the call ended (for billing)
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
  const actions = [];

  if (callId) {
    actions.push({
      Type: "Speak",
      Parameters: {
        CallId: callId,
        Text: message,
        Engine: "Neural",
        LanguageCode: "en-US",
        VoiceId: "Joanna",
      },
    });
  }

  actions.push({ Type: "Hangup", Parameters: { SipResponseCode: "480" } });

  return { SchemaVersion: "1.0", Actions: actions };
}
