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

export function getChimeMeetingsClient(): ChimeSDKMeetingsClient {
  const region = getChimeRegion();
  const credentials = getChimeCredentials();
  return credentials
    ? new ChimeSDKMeetingsClient({ region, credentials })
    : new ChimeSDKMeetingsClient({ region });
}

export function getChimeVoiceClient(): ChimeSDKVoiceClient {
  const region = getChimeRegion();
  const credentials = getChimeCredentials();
  return credentials
    ? new ChimeSDKVoiceClient({ region, credentials })
    : new ChimeSDKVoiceClient({ region });
}

export function getChimeMediaPipelinesClient(): ChimeSDKMediaPipelinesClient {
  const region = getChimeRegion();
  const credentials = getChimeCredentials();
  return credentials
    ? new ChimeSDKMediaPipelinesClient({ region, credentials })
    : new ChimeSDKMediaPipelinesClient({ region });
}
