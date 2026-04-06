import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateStripeExtraSeats } from "@/lib/stripe/plan-seats";

export const runtime = "nodejs";

/**
 * POST /api/community/plan/members
 *
 * Adds a family member to the authenticated PM member's plan, respecting the
 * tier's max_total_members cap, and updates Stripe extra-seat billing when
 * the extra_member_count changes.
 *
 * Body: { full_name, date_of_birth, relationship, birth_time?, birth_city?,
 *          birth_country?, notes? }
 *
 * Response: { family_member, new_total_monthly }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      date_of_birth,
      relationship,
      birth_time,
      birth_city,
      birth_country,
      notes,
    } = body as {
      full_name?: string;
      date_of_birth?: string;
      relationship?: string;
      birth_time?: string;
      birth_city?: string;
      birth_country?: string;
      notes?: string;
    };

    if (!full_name || !date_of_birth) {
      return NextResponse.json(
        { error: "full_name and date_of_birth are required" },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    // Fetch member row with tier details
    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         membership_status,
         stripe_subscription_id,
         extra_member_count,
         pm_plan_tiers (
           id,
           base_price_usd,
           base_member_limit,
           extra_per_member_usd,
           max_total_members,
           stripe_extra_price_id
         )`
      )
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    if (member.membership_status !== "active") {
      return NextResponse.json(
        { error: "Membership is not active" },
        { status: 403 }
      );
    }

    const tier = member.pm_plan_tiers as {
      id: string;
      base_price_usd: number;
      base_member_limit: number;
      extra_per_member_usd: number;
      max_total_members: number;
      stripe_extra_price_id: string | null;
    } | null;

    // Count current family members
    const { count: currentCount } = await admin
      .from("community_family_members")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id);

    const currentTotal = currentCount ?? 0;

    if (tier && currentTotal + 1 > tier.max_total_members) {
      return NextResponse.json(
        {
          error: `Plan limit reached. This plan allows a maximum of ${tier.max_total_members} members.`,
        },
        { status: 422 }
      );
    }

    // Determine age_group
    const dob = new Date(date_of_birth);
    const ageYears =
      (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
    const age_group = ageYears < 14 ? "child" : "adult";

    // Insert new family member
    const { data: familyMember, error: insertError } = await admin
      .from("community_family_members")
      .insert({
        member_id: member.id,
        full_name,
        date_of_birth,
        relationship: relationship ?? null,
        birth_time: birth_time ?? null,
        birth_city: birth_city ?? null,
        birth_country: birth_country ?? null,
        notes: notes ?? null,
        age_group,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const newCount = currentTotal + 1;
    const newExtraCount = tier
      ? Math.max(0, newCount - tier.base_member_limit)
      : 0;
    const prevExtraCount = member.extra_member_count ?? 0;

    // Update Stripe extra-seat quantity if it changed
    if (
      tier &&
      newExtraCount !== prevExtraCount &&
      member.stripe_subscription_id &&
      tier.stripe_extra_price_id
    ) {
      await updateStripeExtraSeats(
        member.stripe_subscription_id,
        tier.stripe_extra_price_id,
        newExtraCount
      );
    }

    // Update community_members.extra_member_count
    await admin
      .from("community_members")
      .update({ extra_member_count: newExtraCount })
      .eq("id", member.id);

    const baseCharge = tier ? Number(tier.base_price_usd) : 0;
    const extraCharge = tier
      ? Number((newExtraCount * Number(tier.extra_per_member_usd)).toFixed(2))
      : 0;
    const newTotalMonthly = Number((baseCharge + extraCharge).toFixed(2));

    return NextResponse.json(
      { family_member: familyMember, new_total_monthly: newTotalMonthly },
      { status: 201 }
    );
  } catch (err) {
    console.error("[community/plan/members] POST error:", err);
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 }
    );
  }
}
