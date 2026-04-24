import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { startChimeRecording } from "@/lib/chime-meetings";

type RecordingPipelineTable = "bookings" | "admin_bookings" | "phone_sessions";

const STARTING_PREFIX = "recording:start:";
const STALE_START_MS = 2 * 60 * 1000;

function makeStartingToken() {
  return `${STARTING_PREFIX}${Date.now()}:${randomUUID()}`;
}

export function isRecordingPipelineStartingToken(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(STARTING_PREFIX);
}

export function isUsableChimePipelineId(value: string | null | undefined) {
  return typeof value === "string" && value.trim() !== "" && !isRecordingPipelineStartingToken(value);
}

function isStaleStartingToken(value: string | null | undefined) {
  if (!isRecordingPipelineStartingToken(value)) return false;
  const timestamp = Number(value.slice(STARTING_PREFIX.length).split(":")[0]);
  return !Number.isFinite(timestamp) || Date.now() - timestamp > STALE_START_MS;
}

async function readPipelineId(
  admin: ReturnType<typeof createAdminClient>,
  table: RecordingPipelineTable,
  sessionId: string,
) {
  const { data, error } = await admin
    .from(table)
    .select("chime_pipeline_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    console.error(`[chime-recording-pipeline] Failed to read ${table} ${sessionId}:`, error.message);
    return null;
  }

  return (data as { chime_pipeline_id?: string | null } | null)?.chime_pipeline_id ?? null;
}

async function clearStartingToken(
  admin: ReturnType<typeof createAdminClient>,
  table: RecordingPipelineTable,
  sessionId: string,
  token: string,
) {
  await admin
    .from(table)
    .update({ chime_pipeline_id: null })
    .eq("id", sessionId)
    .eq("chime_pipeline_id", token);
}

export async function ensureSingleChimeRecordingPipeline(options: {
  table: RecordingPipelineTable;
  sessionId: string;
  meetingId: string;
  s3KeyPrefix: string;
  currentPipelineId?: string | null;
  logLabel: string;
}) {
  const {
    table,
    sessionId,
    meetingId,
    s3KeyPrefix,
    currentPipelineId,
    logLabel,
  } = options;

  const admin = createAdminClient();
  const observedPipelineId = currentPipelineId ?? (await readPipelineId(admin, table, sessionId));

  if (isUsableChimePipelineId(observedPipelineId)) {
    return { status: "exists" as const, pipelineArn: observedPipelineId };
  }

  if (isRecordingPipelineStartingToken(observedPipelineId) && !isStaleStartingToken(observedPipelineId)) {
    return { status: "starting" as const, pipelineArn: null };
  }

  const claim = makeStartingToken();
  let claimQuery = admin
    .from(table)
    .update({ chime_pipeline_id: claim })
    .eq("id", sessionId);

  claimQuery = observedPipelineId
    ? claimQuery.eq("chime_pipeline_id", observedPipelineId)
    : claimQuery.is("chime_pipeline_id", null);

  const { data: claimed, error: claimError } = await claimQuery
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error(`[${logLabel}] Failed to reserve recording pipeline:`, claimError.message);
    return { status: "error" as const, pipelineArn: null };
  }

  if (!claimed) {
    return { status: "busy" as const, pipelineArn: null };
  }

  try {
    const recording = await startChimeRecording(meetingId, s3KeyPrefix);
    if (!recording.pipelineArn) {
      await clearStartingToken(admin, table, sessionId, claim);
      return { status: "skipped" as const, pipelineArn: null };
    }

    const { error: persistError } = await admin
      .from(table)
      .update({ chime_pipeline_id: recording.pipelineArn })
      .eq("id", sessionId)
      .eq("chime_pipeline_id", claim);

    if (persistError) {
      console.error(`[${logLabel}] Failed to persist recording pipeline:`, persistError.message);
      return { status: "error" as const, pipelineArn: recording.pipelineArn };
    }

    return {
      status: "started" as const,
      pipelineId: recording.pipelineId,
      pipelineArn: recording.pipelineArn,
    };
  } catch (err) {
    await clearStartingToken(admin, table, sessionId, claim);
    const name = (err as { name?: string }).name ?? "Error";
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${logLabel}] Failed to start recording: ${name}: ${msg}`);
    return { status: "error" as const, pipelineArn: null };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForUsableChimePipelineId(options: {
  table: RecordingPipelineTable;
  sessionId: string;
  currentPipelineId?: string | null;
  timeoutMs?: number;
}) {
  const {
    table,
    sessionId,
    currentPipelineId,
    timeoutMs = 10_000,
  } = options;

  if (isUsableChimePipelineId(currentPipelineId)) return currentPipelineId;
  if (!isRecordingPipelineStartingToken(currentPipelineId)) return null;

  const admin = createAdminClient();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(500);
    const latest = await readPipelineId(admin, table, sessionId);
    if (isUsableChimePipelineId(latest)) return latest;
    if (!isRecordingPipelineStartingToken(latest)) return null;
  }

  return null;
}
