import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/community/subscription
 *
 * Returns the authenticated user's community membership/subscription details.
 *
 * Response shape:
 * {
 *   subscription: {
 *     membership_type: "perennial_mandalism" | "mystery_school",
 *     plan_type: "individual" | "family",
 *     plan_label: string,
 *     status: string,
 *     amount: number,
 *     currency: "usd",
 *     renewal_date: string | null,
 *     created_at: string,
 *     member_count: number,
 *     max_members: number,
 *   }
 * }
 */

const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  perennial_mandalism: { individual: 9.97, family: 19.97 },
  mystery_school: { individual: 27.0, family: 27.0 },
};

const PLAN_LABELS: Record<string, Record<string, string>> = {
  perennial_mandalism: {
    individual: "Perennial Mandalism — Single",
    family: "Perennial Mandalism — Family",
  },
  mystery_school: {
    individual: "Mystery School",
    family: "Mystery School",
  },
};

const MAX_MEMBERS: Record<string, number> = {
  individual: 1,
  family: 5,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: member, error } = await admin
      .from("community_members")
      .select(
        "id, membership_type, membership_status, plan_type, stripe_subscription_id, joined_at, expires_at"
      )
      .eq("user_id", user.id)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    const membershipType = (member.membership_type ?? "perennial_mandalism") as string;
    const planType = (member.plan_type ?? "individual") as string;

    // Count family members (only relevant for family plan)
    let memberCount = 1;
    if (planType === "family") {
      const { count } = await admin
        .from("community_family_members")
        .select("id", { count: "exact", head: true })
        .eq("member_id", member.id);
      // +1 to include the primary member themselves
      memberCount = (count ?? 0) + 1;
    }

    // Derive renewal_date: prefer expires_at, else derive from Stripe if available
    let renewalDate: string | null = member.expires_at ?? null;

    // If no expires_at stored but subscription is active and Stripe ID exists, fetch from Stripe
    if (!renewalDate && member.stripe_subscription_id && member.membership_status === "active") {
      try {
        const { stripe } = await import("@/lib/stripe/client");
        const sub = await stripe.subscriptions.retrieve(
          member.stripe_subscription_id
        ) as unknown as { current_period_end?: number };
        if (sub.current_period_end) {
          renewalDate = new Date(sub.current_period_end * 1000).toISOString();
        }
      } catch {
        // Non-fatal — proceed without renewal date
      }
    }

    const amount =
      PLAN_AMOUNTS[membershipType]?.[planType] ??
      PLAN_AMOUNTS["perennial_mandalism"]["individual"];

    const planLabel =
      PLAN_LABELS[membershipType]?.[planType] ??
      PLAN_LABELS["perennial_mandalism"]["individual"];

    const maxMembers = planType === "family" ? MAX_MEMBERS["family"] : MAX_MEMBERS["individual"];

    return NextResponse.json({
      subscription: {
        membership_type: membershipType,
        plan_type: planType,
        plan_label: planLabel,
        status: member.membership_status ?? "active",
        amount,
        currency: "usd",
        renewal_date: renewalDate,
        created_at: member.joined_at,
        member_count: Math.min(memberCount, maxMembers),
        max_members: maxMembers,
      },
    });
  } catch (err) {
    console.error("[community/subscription] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
