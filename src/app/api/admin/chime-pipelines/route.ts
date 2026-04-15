import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ListMediaCapturePipelinesCommand,
  DeleteMediaCapturePipelineCommand,
} from "@aws-sdk/client-chime-sdk-media-pipelines";
import { getChimeMediaPipelinesClient } from "@/lib/chime-client";

export const dynamic = "force-dynamic";

/**
 * GET  /api/admin/chime-pipelines  — list all active capture pipelines
 * POST /api/admin/chime-pipelines  — delete a specific pipeline by ID
 *   body: { pipelineId: string }
 */

async function verifyDiviner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return diviner ? user : null;
}

export async function GET() {
  const user = await verifyDiviner();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const client = getChimeMediaPipelinesClient();
    const response = await client.send(new ListMediaCapturePipelinesCommand({}));
    const pipelines = (response.MediaCapturePipelines ?? []).map((p) => ({
      pipelineId: p.MediaPipelineId,
      status: p.Status,
      createdAt: p.CreatedTimestamp,
      updatedAt: p.UpdatedTimestamp,
    }));
    return NextResponse.json({ count: pipelines.length, pipelines });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyDiviner();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { pipelineId } = await request.json();
  if (!pipelineId) {
    return NextResponse.json({ error: "pipelineId required" }, { status: 400 });
  }

  try {
    const client = getChimeMediaPipelinesClient();
    await client.send(
      new DeleteMediaCapturePipelineCommand({ MediaPipelineId: pipelineId })
    );
    return NextResponse.json({ deleted: true, pipelineId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
