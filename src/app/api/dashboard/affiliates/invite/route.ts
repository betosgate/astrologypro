import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAffiliateInvitation } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/affiliates/invite
 *
 * Allows a diviner to invite a potential affiliate partner.
 * Creates a `diviner_affiliates` record with status "pending" and sends an invitation email.
 *
 * Body: { email: string, name: string, message?: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body", status: 422 },
      { status: 422 }
    );
  }

  const { email, name, message } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    email.trim() === "" ||
    typeof name !== "string" ||
    name.trim() === ""
  ) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "name and email are required.",
        status: 422,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve diviner record for this user
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner", status: 403 },
      { status: 403 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check for existing affiliate with this email under this diviner
  const { data: existing } = await admin
    .from("diviner_affiliates")
    .select("id, status")
    .eq("diviner_id", diviner.id)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/409",
        title: "An affiliate with this email already exists under your account",
        detail: `Current status: ${existing.status}`,
        status: 409,
      },
      { status: 409 }
    );
  }

  // Create a pending affiliate record
  const { data: affiliate, error: insertError } = await admin
    .from("diviner_affiliates")
    .insert({
      diviner_id: diviner.id,
      name: name.trim(),
      email: normalizedEmail,
      status: "pending",
      created_by: user.id,
      notes: typeof message === "string" && message.trim() ? `Invitation: ${message.trim()}` : "Invited via dashboard",
    })
    .select("id, name, email, status, created_at")
    .single();

  if (insertError) {
    console.error("[Invite] Failed to create affiliate record:", insertError);
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Failed to create affiliate invitation",
        detail: insertError.message,
        status: 500,
      },
      { status: 500 }
    );
  }

  // Generate a referral link for the affiliate
  const slug = `${(name as string).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}-${randomBytes(4).toString("hex")}`;
  await admin.from("affiliate_referral_links").insert({
    affiliate_id: affiliate.id,
    diviner_id: diviner.id,
    slug,
    is_active: true,
    clicks: 0,
  });

  // Send invitation email (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const acceptUrl = `${appUrl}/affiliate/${slug}`;

  sendAffiliateInvitation({
    to: normalizedEmail,
    affiliateName: name.trim(),
    divinerName: diviner.display_name ?? "A diviner",
    message: typeof message === "string" && message.trim() ? message.trim() : undefined,
    acceptUrl,
  }).catch((err) =>
    console.error("[Invite] Failed to send affiliate invitation email:", err)
  );

  return NextResponse.json(
    { data: affiliate, referralLink: `${appUrl}/ref/${slug}` },
    { status: 201 }
  );
}
