import {
  ChimeSDKMeetingsClient,
} from "@aws-sdk/client-chime-sdk-meetings";
import {
  ChimeSDKVoiceClient,
} from "@aws-sdk/client-chime-sdk-voice";
import {
  ChimeSDKMediaPipelinesClient,
} from "@aws-sdk/client-chime-sdk-media-pipelines";

function getChimeCredentials() {
  const accessKeyId =
    process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }
  return undefined; // Falls back to default credential chain (IAM role, instance profile)
}

function getChimeRegion() {
  return process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
}

// ── Singleton clients — reuse across requests to avoid cold TCP/TLS per call ─
let _meetingsClient: ChimeSDKMeetingsClient | null = null;
let _voiceClient: ChimeSDKVoiceClient | null = null;
let _mediaPipelinesClient: ChimeSDKMediaPipelinesClient | null = null;

export function getChimeMeetingsClient(): ChimeSDKMeetingsClient {
  if (!_meetingsClient) {
    const region = getChimeRegion();
    const credentials = getChimeCredentials();
    _meetingsClient = credentials
      ? new ChimeSDKMeetingsClient({ region, credentials })
      : new ChimeSDKMeetingsClient({ region });
  }
  return _meetingsClient;
}

export function getChimeVoiceClient(): ChimeSDKVoiceClient {
  if (!_voiceClient) {
    const region = getChimeRegion();
    const credentials = getChimeCredentials();
    _voiceClient = credentials
      ? new ChimeSDKVoiceClient({ region, credentials })
      : new ChimeSDKVoiceClient({ region });
  }
  return _voiceClient;
}

export function getChimeMediaPipelinesClient(): ChimeSDKMediaPipelinesClient {
  if (!_mediaPipelinesClient) {
    const region = getChimeRegion();
    const credentials = getChimeCredentials();
    _mediaPipelinesClient = credentials
      ? new ChimeSDKMediaPipelinesClient({ region, credentials })
      : new ChimeSDKMediaPipelinesClient({ region });
  }
  return _mediaPipelinesClient;
}
