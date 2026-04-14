import {
  CreateMeetingCommand,
  CreateAttendeeCommand,
  DeleteMeetingCommand,
  GetMeetingCommand,
} from "@aws-sdk/client-chime-sdk-meetings";
import {
  CreateMediaCapturePipelineCommand,
  DeleteMediaCapturePipelineCommand,
} from "@aws-sdk/client-chime-sdk-media-pipelines";
import {
  getChimeMeetingsClient,
  getChimeMediaPipelinesClient,
} from "./chime-client";

const RECORDING_BUCKET = process.env.CHIME_RECORDING_BUCKET ?? "";

export async function createChimeMeeting(
  bookingId: string,
  durationMinutes: number,
  maxParticipants: number
): Promise<{
  meetingId: string;
  externalMeetingId: string;
  mediaRegion: string;
}> {
  const client = getChimeMeetingsClient();
  const externalMeetingId = `astropro-${bookingId.slice(0, 8)}-${Date.now()}`;

  const response = await client.send(
    new CreateMeetingCommand({
      ClientRequestToken: externalMeetingId,
      ExternalMeetingId: externalMeetingId,
      MediaRegion: process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1",
      MeetingFeatures: {
        Audio: { EchoReduction: "AVAILABLE" },
        Video: { MaxResolution: "FHD" },
        Content: { MaxResolution: "FHD" },
        Attendee: { MaxCount: Math.max(maxParticipants, 5) },
      },
    })
  );

  const meeting = response.Meeting;
  if (!meeting?.MeetingId) {
    throw new Error("Chime SDK: Failed to create meeting — no MeetingId returned");
  }

  return {
    meetingId: meeting.MeetingId,
    externalMeetingId,
    mediaRegion: meeting.MediaRegion ?? "us-east-1",
  };
}

export async function getChimeMeeting(meetingId: string) {
  const client = getChimeMeetingsClient();
  const response = await client.send(
    new GetMeetingCommand({ MeetingId: meetingId })
  );
  const meeting = response.Meeting;
  if (!meeting?.MeetingId || !meeting.MediaPlacement) {
    throw new Error("Chime SDK: Meeting not found or missing MediaPlacement");
  }
  return meeting;
}

export async function createChimeAttendee(
  meetingId: string,
  externalUserId: string
): Promise<{
  attendeeId: string;
  joinToken: string;
}> {
  const client = getChimeMeetingsClient();

  const response = await client.send(
    new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId: externalUserId,
    })
  );

  const attendee = response.Attendee;
  if (!attendee?.AttendeeId || !attendee?.JoinToken) {
    throw new Error("Chime SDK: Failed to create attendee — missing AttendeeId or JoinToken");
  }

  return {
    attendeeId: attendee.AttendeeId,
    joinToken: attendee.JoinToken,
  };
}

export async function endChimeMeeting(meetingId: string): Promise<void> {
  const client = getChimeMeetingsClient();
  await client.send(
    new DeleteMeetingCommand({ MeetingId: meetingId })
  );
}

export async function startChimeRecording(
  meetingId: string,
  s3KeyPrefix: string
): Promise<{ pipelineId: string }> {
  if (!RECORDING_BUCKET) {
    console.warn("CHIME_RECORDING_BUCKET not set — skipping recording");
    return { pipelineId: "" };
  }

  const client = getChimeMediaPipelinesClient();

  const response = await client.send(
    new CreateMediaCapturePipelineCommand({
      SourceType: "ChimeSdkMeeting",
      SourceArn: `arn:aws:chime::${await getAccountId()}:meeting/${meetingId}`,
      SinkType: "S3Bucket",
      SinkArn: `arn:aws:s3:::${RECORDING_BUCKET}/${s3KeyPrefix}`,
    })
  );

  const pipeline = response.MediaCapturePipeline;
  if (!pipeline?.MediaPipelineId) {
    throw new Error("Chime SDK: Failed to create media capture pipeline");
  }

  return { pipelineId: pipeline.MediaPipelineId };
}

export async function stopChimeRecording(pipelineId: string): Promise<void> {
  if (!pipelineId) return;

  const client = getChimeMediaPipelinesClient();
  await client.send(
    new DeleteMediaCapturePipelineCommand({
      MediaPipelineId: pipelineId,
    })
  );
}

/** Resolve AWS account ID from STS for ARN construction */
async function getAccountId(): Promise<string> {
  // Use env var if set (avoids an STS call per request)
  if (process.env.AWS_ACCOUNT_ID) return process.env.AWS_ACCOUNT_ID;

  const { STSClient, GetCallerIdentityCommand } = await import(
    "@aws-sdk/client-sts"
  );
  const sts = new STSClient({
    region: process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1",
  });
  const identity = await sts.send(new GetCallerIdentityCommand({}));
  return identity.Account ?? "";
}
