import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

/**
 * GET /api/community/plan
 *
 * Returns plan details for the authenticated PM member.
 *
 * Reads the member's real saved tier from community_members.pm_tier_id
 * and matches it against active pm_plan_tiers. Falls back to the
 * lowest-order active tier only when pm_tier_id is NULL or does not
 * match any active tier (a warning is logged in that case).
 *
 * Field names in the response are aligned with the Plan / PlanTier
 * TypeScript types used by the page component:
 *   tier.base_price         ← pm_plan_tiers.base_price_usd
 *   tier.included_members   ← pm_plan_tiers.base_member_limit
 *   tier.extra_member_price ← pm_plan_tiers.extra_per_member_usd
 *   plan.member_count       ← family_members.length
 *   plan.extra_member_count ← max(0, member_count - tier.included_members)
 *   plan.extra_member_charge← extra_member_count × tier.extra_member_price
 */
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

    const { data: member, error: memberError } = await admin
      .from("community_members")
      .select(
        `id,
         membership_status,
         current_period_end,
         stripe_subscription_id,
         extra_member_count,
         pm_tier_id,
         plan_type`
      )
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "No community membership found" },
        { status: 404 }
      );
    }

    let resolvedPlanType = member.plan_type;
    if (member.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          member.stripe_subscription_id,
          { expand: ["items.data.price.product"] }
        );
        const primaryItem = subscription.items.data[0];
        const product = primaryItem?.price?.product;
        const productName = product && typeof product === "object" && "name" in product ? (product as { name?: string }).name : null;
        if (productName?.toLowerCase().includes("couple")) {
          resolvedPlanType = "couple";
        }
      } catch (err) {
        console.error("[community/plan] failed to fetch stripe subscription:", err);
      }
    }

    // Fetch family members + available tiers in parallel
    const [{ data: familyMembers, error: familyError }, { data: rawTiers }] =
      await Promise.all([
        admin
          .from("community_family_members")
          .select("id, full_name, relationship, age_group, date_of_birth")
          .eq("member_id", member.id)
          .order("created_at", { ascending: true }),
        admin
          .from("pm_plan_tiers")
          .select(
            "id, name, description, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members"
          )
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);

    if (familyError) {
      return NextResponse.json({ error: familyError.message }, { status: 500 });
    }

    // Map DB column names → page TypeScript type field names
    type RawTier = {
      id: string;
      name: string;
      description: string;
      base_price_usd: number;
      base_member_limit: number;
      extra_per_member_usd: number;
      max_total_members: number;
    };
    type MappedTier = {
      id: string;
      name: string;
      description: string;
      base_price: number;
      included_members: number;
      extra_member_price: number;
      max_total_members: number;
    };

    const mapTier = (t: RawTier): MappedTier => ({
      id: t.id,
      name: t.name,
      description: t.description,
      base_price: Number(t.base_price_usd),
      included_members: t.base_member_limit,
      extra_member_price: Number(t.extra_per_member_usd),
      max_total_members: t.max_total_members,
    });

    const { data: plans, error: plansErr } = await admin
      .from("pricing_plans")
      .select("plan_id, display_name, amount, description, custom_fields")
      .in("plan_id", ["plan_pm_individual", "plan_pm_couple", "plan_pm_family"])
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (plansErr) {
      console.error("[community/plan] failed to fetch pricing plans:", plansErr);
    }

    const availableTiers: MappedTier[] = (plans ?? []).map((p) => {
      const customFields = p.custom_fields as Array<{ slug: string; value: string }> | null;
      const membersField = customFields?.find((f) => f.slug === "members");
      let includedMembers = 1;
      if (membersField) {
        const val = membersField.value;
        if (val.includes("Up to")) {
          includedMembers = parseInt(val.replace("Up to ", ""), 10);
        } else {
          includedMembers = parseInt(val, 10);
        }
      }

      return {
        id: p.plan_id,
        name: p.display_name,
        description: p.description,
        base_price: Number(p.amount),
        included_members: includedMembers,
        extra_member_price: 5, // Keep as requested previously
        max_total_members: includedMembers,
      };
    });

    // If query returned nothing, use fallback to prevent empty response
    if (availableTiers.length === 0) {
      availableTiers.push(
        {
          id: "plan_pm_individual",
          name: "Individual Plan",
          description: "Single member access to the Perennial Mandalism community.",
          base_price: 19.95,
          included_members: 1,
          extra_member_price: 5,
          max_total_members: 1,
        },
        {
          id: "plan_pm_couple",
          name: "Couple Plan",
          description: "Two members sharing one household — joint access to the community.",
          base_price: 29.95,
          included_members: 2,
          extra_member_price: 5,
          max_total_members: 2,
        },
        {
          id: "plan_pm_family",
          name: "Family Plan",
          description: "Up to 5 family members — full household access to the community.",
          base_price: 39.95,
          included_members: 5,
          extra_member_price: 5,
          max_total_members: 5,
        }
      );
    }

    const savedTierId = (member as { pm_tier_id?: string | null }).pm_tier_id ?? null;
    const planType = resolvedPlanType ?? null;
    let tier: MappedTier | null = null;
    
    const hardcodedPlans: Record<string, MappedTier> = {
      plan_pm_individual: {
        id: "plan_pm_individual",
        name: "Individual Plan",
        description: "Single member access to the Perennial Mandalism community.",
        base_price: 19.95,
        included_members: 1,
        extra_member_price: 5,
        max_total_members: 1,
      },
      plan_pm_couple: {
        id: "plan_pm_couple",
        name: "Couple Plan",
        description: "Two members sharing one household — joint access to the community.",
        base_price: 29.95,
        included_members: 2,
        extra_member_price: 5,
        max_total_members: 2,
      },
      plan_pm_family: {
        id: "plan_pm_family",
        name: "Family Plan",
        description: "Up to 5 family members — full household access to the community.",
        base_price: 39.95,
        included_members: 5,
        extra_member_price: 5,
        max_total_members: 5,
      },
    };

    if (savedTierId) {
      tier = availableTiers.find((t) => t.id === savedTierId) ?? null;
      if (!tier) {
        // 1. Check if it's one of our known hardcoded IDs
        if (savedTierId in hardcodedPlans) {
          tier = hardcodedPlans[savedTierId];
        } else {
          // 2. Fallback: check if the saved tier ID belongs to pm_plan_tiers and map by name
          const { data: dbTier } = await admin
            .from("pm_plan_tiers")
            .select("name")
            .eq("id", savedTierId)
            .single();
            
          if (dbTier) {
            const name = dbTier.name.toLowerCase();
            if (name.includes("individual")) tier = availableTiers.find(t => t.id === "plan_pm_individual") || hardcodedPlans.plan_pm_individual;
            else if (name.includes("couple")) tier = availableTiers.find(t => t.id === "plan_pm_couple") || hardcodedPlans.plan_pm_couple;
            else if (name.includes("family")) tier = availableTiers.find(t => t.id === "plan_pm_family") || hardcodedPlans.plan_pm_family;
          }
        }
      }
    }

    // 3. Fallback to plan_type if tier is still null
    if (!tier && planType) {
      const type = planType.toLowerCase();
      if (type.includes("individual")) tier = availableTiers.find(t => t.id === "plan_pm_individual") || hardcodedPlans.plan_pm_individual;
      else if (type.includes("couple")) tier = availableTiers.find(t => t.id === "plan_pm_couple") || hardcodedPlans.plan_pm_couple;
      else if (type.includes("family")) tier = availableTiers.find(t => t.id === "plan_pm_family") || hardcodedPlans.plan_pm_family;
    }

    if (!tier) tier = availableTiers[0] ?? hardcodedPlans.plan_pm_individual;

    const memberCount = (familyMembers ?? []).length;
    const extraMemberCount = tier
      ? Math.max(0, memberCount - tier.included_members)
      : 0;
    const extraMemberCharge = tier
      ? Number((extraMemberCount * tier.extra_member_price).toFixed(2))
      : 0;
    const totalMonthly = tier
      ? Number((tier.base_price + extraMemberCharge).toFixed(2))
      : 0;

    return NextResponse.json({
      plan: {
        tier,
        available_tiers: availableTiers,
        member_count: memberCount,
        extra_member_count: extraMemberCount,
        extra_member_charge: extraMemberCharge,
        total_monthly: totalMonthly,
        status: member.membership_status,
        current_period_end: member.current_period_end ?? null,
        stripe_subscription_id: member.stripe_subscription_id ?? null,
        family_members: familyMembers ?? [],
      },
    });
  } catch (err) {
    console.error("[community/plan] GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve plan details" },
      { status: 500 }
    );
  }
}
