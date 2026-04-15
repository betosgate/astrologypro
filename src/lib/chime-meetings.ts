import {
  CreateMeetingCommand,
  CreateAttendeeCommand,
  DeleteMeetingCommand,
  GetMeetingCommand,
  ListAttendeesCommand,
} from "@aws-sdk/client-chime-sdk-meetings";
import {
  CreateMediaCapturePipelineCommand,
  CreateMediaConcatenationPipelineCommand,
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
): Promise<{ pipelineId: string; pipelineArn: string }> {
  if (!RECORDING_BUCKET) {
    console.warn("CHIME_RECORDING_BUCKET not set — skipping recording");
    return { pipelineId: "", pipelineArn: "" };
  }

  const accountId = await getAccountId();
  const client = getChimeMediaPipelinesClient();

  const response = await client.send(
    new CreateMediaCapturePipelineCommand({
      SourceType: "ChimeSdkMeeting",
      SourceArn: `arn:aws:chime::${accountId}:meeting/${meetingId}`,
      SinkType: "S3Bucket",
      SinkArn: `arn:aws:s3:::${RECORDING_BUCKET}/${s3KeyPrefix}`,
      // Capture both audio + composited video so recordings include the full
      // session visually, not just audio segments.
      ChimeSdkMeetingConfiguration: {
        ArtifactsConfiguration: {
          Audio: {
            MuxType: "AudioWithCompositedVideo",
          },
          Video: {
            State: "Enabled",
            MuxType: "VideoOnly",
          },
          Content: {
            State: "Disabled",
            MuxType: "ContentOnly",
          },
          CompositedVideo: {
            Layout: "GridView",
            Resolution: "FHD",
            GridViewConfiguration: {
              ContentShareLayout: "ActiveSpeakerOnly",
            },
          },
        },
      },
    })
  );

  const pipeline = response.MediaCapturePipeline;
  if (!pipeline?.MediaPipelineId) {
    throw new Error("Chime SDK: Failed to create media capture pipeline — no MediaPipelineId returned");
  }

  const pipelineId = pipeline.MediaPipelineId;
  // Some SDK versions don't return the ARN in the create response — construct it
  const pipelineArn =
    pipeline.MediaPipelineArn ??
    `arn:aws:chime::${accountId}:media-pipeline/${pipelineId}`;

  return { pipelineId, pipelineArn };
}

/**
 * Creates a Media Concatenation Pipeline that merges all the segment files
 * from a capture pipeline into a single named MP4 file.
 * Call this when the session ends (after stopChimeRecording).
 * Output: recordings/{bookingId}/final/{meetingId}.mp4
 */
export async function startChimeConcatenation(
  capturePipelineArn: string,
  meetingId: string,
  bookingId: string
): Promise<void> {
  if (!RECORDING_BUCKET || !capturePipelineArn) return;

  const client = getChimeMediaPipelinesClient();

  await client.send(
    new CreateMediaConcatenationPipelineCommand({
      Sources: [
        {
          Type: "MediaCapturePipeline",
          MediaCapturePipelineSourceConfiguration: {
            MediaPipelineArn: capturePipelineArn,
            ChimeSdkMeetingConfiguration: {
              ArtifactsConfiguration: {
                Audio: { State: "Enabled" },
                Video: { State: "Disabled" },
                Content: { State: "Disabled" },
                DataChannel: { State: "Disabled" },
                TranscriptionMessages: { State: "Disabled" },
                MeetingEvents: { State: "Disabled" },
                CompositedVideo: { State: "Enabled" },
              },
            },
          },
        },
      ],
      Sinks: [
        {
          Type: "S3Bucket",
          S3BucketSinkConfiguration: {
            // Named by meetingId so retrieval is straightforward
            Destination: `arn:aws:s3:::${RECORDING_BUCKET}/recordings/${bookingId}/final/${meetingId}.mp4`,
          },
        },
      ],
    })
  );
}

export async function listChimeAttendees(
  meetingId: string
): Promise<{ attendeeId: string; externalUserId: string }[]> {
  const client = getChimeMeetingsClient();
  const response = await client.send(
    new ListAttendeesCommand({ MeetingId: meetingId })
  );
  return (response.Attendees ?? []).map((a) => ({
    attendeeId: a.AttendeeId ?? "",
    externalUserId: a.ExternalUserId ?? "",
  }));
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
