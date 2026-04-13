import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackDivinerActivityEvent } from "@/lib/diviner-analytics";
import { calculateSpamScore } from "@/lib/spam-check";
import {
  isPublicSectionBlocked,
  normalizePublishPolicy,
  publishBlockMessage,
} from "@/lib/diviner-publishing";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problemDetail(
  status: number,
  title: string,
  detail: string
): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    {
      status,
      headers: { "Content-Type": "application/problem+json" },
    }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  const {
    name,
    email,
    text,
    rating,
    service_name,
    display_alias,
    consent_marketing,
  } = body as {
    name?: unknown;
    email?: unknown;
    text?: unknown;
    rating?: unknown;
    service_name?: unknown;
    display_alias?: unknown;
    consent_marketing?: unknown;
  };

  // Validation
  const errors: Record<string, string> = {};

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.name = "Name is required.";
  }

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    errors.email = "A valid email address is required.";
  }

  if (!text || typeof text !== "string") {
    errors.text = "Testimonial text is required.";
  } else if (text.trim().length < 20) {
    errors.text = "Testimonial must be at least 20 characters.";
  } else if (text.trim().length > 2000) {
    errors.text = "Testimonial must be 2000 characters or fewer.";
  }

  if (rating !== undefined && rating !== null) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      errors.rating = "Rating must be an integer between 1 and 5.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Validation Error",
        detail: "One or more fields are invalid.",
        status: 422,
        errors,
      },
      { status: 422, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const cleanName = (name as string).trim();
  const cleanEmail = (email as string).trim().toLowerCase();
  const cleanText = (text as string).trim();
  const cleanRating = rating != null ? Number(rating) : null;
  const cleanServiceName =
    typeof service_name === "string" && service_name.trim()
      ? service_name.trim()
      : null;
  const cleanAlias =
    typeof display_alias === "string" && display_alias.trim()
      ? display_alias.trim()
      : null;
  const cleanConsent =
    consent_marketing === true || consent_marketing === "true";

  const admin = createAdminClient();

  // Look up diviner by username
  const { data: diviner, error: divinerErr } = await admin
    .from("diviners")
    .select("id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (divinerErr || !diviner) {
    return problemDetail(404, "Not Found", "Diviner not found.");
  }
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  if (isPublicSectionBlocked(publishPolicy, "testimonials")) {
    return problemDetail(
      403,
      "Publishing blocked",
      publishBlockMessage(
        publishPolicy,
        "Testimonial publishing has been blocked for this diviner."
      )
    );
  }

  // Rate limit: same email + diviner within 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("diviner_id", diviner.id)
    // stored as client_name contains email — we store email in client_name field
    // Actually we store submitter email in a dedicated way:
    // We'll check by filtering on the raw insert email stored below.
    // Since we store email in `client_name` only for public submissions,
    // we filter by client_name = email.
    .eq("client_name", cleanEmail)
    .gte("created_at", since);

  if ((recentCount ?? 0) > 0) {
    return problemDetail(
      429,
      "Too Many Requests",
      "You have already submitted a testimonial for this diviner in the past 24 hours. Please try again later."
    );
  }

  // Spam check
  const spamScore = calculateSpamScore(cleanText, cleanName, cleanEmail);
  if (spamScore >= 0.7) {
    // Do not reveal spam detection — return generic failure
    return problemDetail(
      422,
      "Submission blocked",
      "Your testimonial could not be submitted."
    );
  }

  // Derive ip from headers
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : null;

  // Insert
  const { data: inserted, error: insertErr } = await admin
    .from("testimonials")
    .insert({
      diviner_id: diviner.id,
      client_id: null,
      // We use client_name to store the email for rate limiting above,
      // and display_alias / the display name separately.
      client_name: cleanEmail,
      display_alias: cleanAlias ?? cleanName.split(" ")[0],
      rating: cleanRating,
      text: cleanText,
      service_type: cleanServiceName,
      service_name: cleanServiceName,
      status: "submitted",
      is_featured: false,
      spam_score: spamScore,
      ip_address: ip,
      consent_marketing: cleanConsent,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[testimonials/submit] insert error:", insertErr);
    return problemDetail(
      500,
      "Internal Server Error",
      "Failed to save testimonial. Please try again."
    );
  }

  await trackDivinerActivityEvent({
    divinerId: diviner.id,
    activityType: "testimonial_submitted",
    path: `/${username}`,
    referrer: req.headers.get("referer"),
    request: req,
    metadata: {
      testimonialId: inserted.id,
      rating: cleanRating,
      serviceName: cleanServiceName,
    },
  });

  return NextResponse.json(
    {
      id: inserted.id,
      message:
        "Thank you! Your testimonial has been submitted for review.",
    },
    { status: 201 }
  );
}
