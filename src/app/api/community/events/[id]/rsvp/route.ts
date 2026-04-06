import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["going", "maybe", "not_going"] as const;
type RsvpStatus = (typeof VALID_STATUSES)[number];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET — current user's RSVP status + aggregate counts for this event
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: event_id } = await params;

  const admin = createAdminClient();

  // Current user's RSVP
  const { data: myRsvp } = await admin
    .from("event_rsvps")
    .select("rsvp_status")
    .eq("event_id", event_id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Aggregate counts
  const [goingRes, maybeRes] = await Promise.all([
    admin
      .from("event_rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .eq("rsvp_status", "going"),
    admin
      .from("event_rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .eq("rsvp_status", "maybe"),
  ]);

  return NextResponse.json({
    my_rsvp: myRsvp?.rsvp_status ?? null,
    going_count: goingRes.count ?? 0,
    maybe_count: maybeRes.count ?? 0,
  });
}

// POST — upsert RSVP
// Body: { status: 'going' | 'maybe' | 'not_going' }
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: event_id } = await params;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status as RsvpStatus;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: going, maybe, not_going" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("event_rsvps")
    .upsert(
      {
        event_id,
        user_id: user.id,
        rsvp_status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" }
    )
    .select("rsvp_status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rsvp: { status: data.rsvp_status, created_at: data.created_at } });
}

// DELETE — remove RSVP
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: event_id } = await params;

  const admin = createAdminClient();
  // Object-level ownership enforced by filtering on user_id
  const { error } = await admin
    .from("event_rsvps")
    .delete()
    .eq("event_id", event_id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
