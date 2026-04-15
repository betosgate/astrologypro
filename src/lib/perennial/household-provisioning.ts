import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

/**
 * Generates a strong password compliant with the spec from
 * tasks/08.04.2026/perennial/00-master-task.md:
 *
 *   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/
 *
 * - minimum length 12
 * - at least one uppercase, one lowercase, one digit, one special
 * - avoids ambiguous characters (0/O, 1/l/I) for readability
 *
 * Strategy: pick 4 mandatory characters (one from each class), then fill
 * the remaining 12 from the full alphabet. Shuffle the final array using
 * crypto.randomBytes so the mandatory characters aren't always at the
 * start.
 */
export function generatePerennialPassword(length = 16): string {
  if (length < 12) length = 12;

  const lowers = "abcdefghjkmnpqrstuvwxyz";        // no i,l,o
  const uppers = "ABCDEFGHJKMNPQRSTUVWXYZ";        // no I,L,O
  const digits = "23456789";                       // no 0,1
  const specials = "@#$%^&+=!?";

  const all = lowers + uppers + digits + specials;

  function pick(set: string): string {
    // crypto-grade index picker
    const buf = randomBytes(1);
    return set[buf[0] % set.length];
  }

  const out: string[] = [
    pick(lowers),
    pick(uppers),
    pick(digits),
    pick(specials),
  ];
  while (out.length < length) {
    out.push(pick(all));
  }

  // Fisher–Yates shuffle backed by crypto.randomBytes so the four mandatory
  // characters aren't always at indices 0..3.
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

// ─── Household payload shape ──────────────────────────────────────────────

export type PerennialPlanKey = "single" | "couple" | "family";

export interface HouseholdMemberPayload {
  is_primary: boolean;
  // Legacy relation rules. Primary uses relation_type='Self' / sub_relation=null.
  // Additional members use relation_type='Couple'|'Family' + a gated sub_relation.
  relation_type: string;
  sub_relation: string | null;
  // Required core fields
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  state: string;
  city: string;
  zip: string;
  address: string;
  occupation: string;
  date_of_birth: string;
  birth_time: string;
  birth_location_label: string;
  birth_lat: number;
  birth_lng: number;
  birth_tzone: string;
  // Full optional questionnaire (25 fields, all nullable)
  relationship_status: string | null;
  personality: string | null;
  strengths: string | null;
  lifeAreasFulfilling: string | null;
  lifeAreasImprovement: string | null;
  longTermGoals: string | null;
  majorLifeEvents: string | null;
  stressManagement: string | null;
  workLifeBalance: string | null;
  relationship_with_family: string | null;
  biggest_current_challenges: string | null;
  focus_on_specific_relationships: string | null;
  guidance_on_specific_decision: string | null;
  concerns_about_romantic_life: string | null;
  ongoing_projects_or_plans: string | null;
  social_life_fulfillment: string | null;
  spiritualPractices: string | null;
  selfDiscovery: string | null;
  externalInfluences: string | null;
  achieveFromReading: string | null;
  specificQuestions: string | null;
  goalsOutcomes: string | null;
  practicalSpiritualPref: string | null;
  mainConcern: string | null;
  additionalInfo: string | null;
}

export interface HouseholdPayload {
  plan_key: PerennialPlanKey;
  members: HouseholdMemberPayload[];
}

export interface ProvisionResult {
  ok: boolean;
  user_ids: string[];
  errors: Array<{ email: string; error: string }>;
}

// ─── Provisioning ─────────────────────────────────────────────────────────

/**
 * Provisions every household member as a real Supabase auth user + a
 * community_members row. Generates a strong password per member and
 * emails it. Best-effort per member — one failure does not abort the
 * batch (the webhook records errors and the operator can re-process via
 * the admin UI / a future retry endpoint).
 *
 * Idempotent at the email level: if an auth user with that email already
 * exists, the existing user is reused and no new password is set or
 * emailed.
 */
export async function provisionPerennialHousehold(
  admin: SupabaseClient,
  household: HouseholdPayload,
): Promise<ProvisionResult> {
  const userIds: string[] = [];
  const errors: ProvisionResult["errors"] = [];

  // Identify the primary member (the billing account holder).
  const primary = household.members.find((m) => m.is_primary);
  if (!primary) {
    return {
      ok: false,
      user_ids: [],
      errors: [{ email: "(none)", error: "No primary member in household" }],
    };
  }

  let primaryCommunityMemberId: string | null = null;

  for (let i = 0; i < household.members.length; i++) {
    const member = household.members[i];
    const emailNormalized = member.email.trim().toLowerCase();
    const fullName = `${member.first_name} ${member.last_name}`.trim();

    try {
      // 1. Create or find the Supabase auth user.
      const password = generatePerennialPassword();
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email: emailNormalized,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            first_name: member.first_name,
            last_name: member.last_name,
            relation_type: member.relation_type,
            sub_relation: member.sub_relation,
            phone: member.phone,
            is_primary: member.is_primary,
          },
        });

      let userId: string;
      let sentNewPassword = true;

      if (createError) {
        // If the email is already registered, find the existing user and
        // reuse it. Don't reset their password — they may already have an
        // account they use. Just attach them to the household.
        const msg = createError.message ?? "";
        if (/already (registered|exists)|User already/i.test(msg)) {
          const { data: usersListData } =
            await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const usersListArr = (usersListData?.users ?? []) as Array<{ id: string; email?: string }>;
          const existing = usersListArr.find(
            (u) => (u.email ?? "").toLowerCase() === emailNormalized,
          );
          if (!existing) {
            throw new Error(`Existing user lookup failed for ${emailNormalized}`);
          }
          userId = existing.id;
          sentNewPassword = false;
        } else {
          throw new Error(msg);
        }
      } else if (created?.user) {
        userId = created.user.id;
      } else {
        throw new Error("auth.admin.createUser returned no user");
      }

      userIds.push(userId);

      // 2. Insert / upsert a community_members row for this user.
      const isFamilyPlan =
        household.plan_key === "couple" || household.plan_key === "family";

      // intake_data captures the full optional questionnaire (25 fields)
      // for every member, plus core profile fields that don't have
      // dedicated columns on community_members.
      const intakeData = {
        relation_type: member.relation_type,
        sub_relation: member.sub_relation,
        phone: member.phone,
        gender: member.gender,
        state: member.state,
        city: member.city,
        zip: member.zip,
        address: member.address,
        occupation: member.occupation,
        date_of_birth: member.date_of_birth,
        birth_time: member.birth_time,
        birth_location_label: member.birth_location_label,
        birth_lat: member.birth_lat,
        birth_lng: member.birth_lng,
        birth_tzone: member.birth_tzone,
        // Optional questionnaire — every key from task 03
        relationship_status: member.relationship_status,
        personality: member.personality,
        strengths: member.strengths,
        lifeAreasFulfilling: member.lifeAreasFulfilling,
        lifeAreasImprovement: member.lifeAreasImprovement,
        longTermGoals: member.longTermGoals,
        majorLifeEvents: member.majorLifeEvents,
        stressManagement: member.stressManagement,
        workLifeBalance: member.workLifeBalance,
        relationship_with_family: member.relationship_with_family,
        biggest_current_challenges: member.biggest_current_challenges,
        focus_on_specific_relationships: member.focus_on_specific_relationships,
        guidance_on_specific_decision: member.guidance_on_specific_decision,
        concerns_about_romantic_life: member.concerns_about_romantic_life,
        ongoing_projects_or_plans: member.ongoing_projects_or_plans,
        social_life_fulfillment: member.social_life_fulfillment,
        spiritualPractices: member.spiritualPractices,
        selfDiscovery: member.selfDiscovery,
        externalInfluences: member.externalInfluences,
        achieveFromReading: member.achieveFromReading,
        specificQuestions: member.specificQuestions,
        goalsOutcomes: member.goalsOutcomes,
        practicalSpiritualPref: member.practicalSpiritualPref,
        mainConcern: member.mainConcern,
        additionalInfo: member.additionalInfo,
        // Household linkage for non-primary members
        household_primary_email: member.is_primary
          ? null
          : primary.email.trim().toLowerCase(),
      };

      const { data: cmRow, error: cmError } = await admin
        .from("community_members")
        .upsert(
          {
            user_id: userId,
            email: emailNormalized,
            full_name: fullName,
            phone: member.phone,
            gender: member.gender,
            state: member.state,
            city: member.city,
            zip: member.zip,
            address: member.address,
            relation_type: member.relation_type,
            membership_type: "perennial_mandalism",
            membership_status: "active",
            plan_type: isFamilyPlan ? "family" : "individual",
            joined_at: new Date().toISOString(),
            intake_data: intakeData,
          },
          { onConflict: "user_id" },
        )
        .select("id")
        .single();

      if (cmError) {
        throw new Error(`community_members upsert failed: ${cmError.message}`);
      }
      if (member.is_primary) {
        primaryCommunityMemberId = cmRow.id;
      }

      // 3. For non-primary members, add a community_family_members row
      //    pointing at the primary's community_members row so the existing
      //    family management UI can list them.
      if (!member.is_primary && primaryCommunityMemberId) {
        const familyPayload = {
          member_id: primaryCommunityMemberId,
          user_id: userId,
          full_name: fullName,
          invite_email: emailNormalized,
          // Use the legacy sub_relation as the relationship label —
          // it's the most specific value (e.g. "Wife", "Son").
          relationship: member.sub_relation ?? member.relation_type ?? "Other",
          date_of_birth: member.date_of_birth,
          birth_time: member.birth_time,
          birth_city: member.birth_location_label,
          birth_lat: member.birth_lat,
          birth_lng: member.birth_lng,
          age_group:
            (Date.now() - new Date(member.date_of_birth).getTime()) /
              (365.25 * 24 * 3600 * 1000) <
            14
              ? "child"
              : "adult",
        };

        const { data: existingFamilyMember } = await admin
          .from("community_family_members")
          .select("id")
          .eq("member_id", primaryCommunityMemberId)
          .or(`user_id.eq.${userId},invite_email.eq.${emailNormalized}`)
          .maybeSingle();

        if (existingFamilyMember?.id) {
          await admin
            .from("community_family_members")
            .update(familyPayload)
            .eq("id", existingFamilyMember.id);
        } else {
          await admin.from("community_family_members").insert(familyPayload);
        }
      }

      // 4. Email the credentials only when we created a NEW account.
      if (sentNewPassword) {
        await sendEmail({
          to: emailNormalized,
          subject: "Welcome to Perennial Mandalism — your account credentials",
          html: buildCredentialsEmailHtml({
            name: fullName,
            email: emailNormalized,
            password,
            isPrimary: member.is_primary,
          }),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[perennial/provision] member ${emailNormalized} failed:`,
        message,
      );
      errors.push({ email: emailNormalized, error: message });
    }
  }

  return {
    ok: errors.length === 0,
    user_ids: userIds,
    errors,
  };
}

// ─── Email body ───────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCredentialsEmailHtml({
  name,
  email,
  password,
  isPrimary,
}: {
  name: string;
  email: string;
  password: string;
  isPrimary: boolean;
}): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const loginUrl = `${appUrl}/login`;

  return `
    <div style="font-family: Inter, Roboto, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #18181b;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">
        Welcome to Perennial Mandalism, ${escapeHtml(name)}
      </h1>
      <p style="margin: 0 0 16px; color: #52525b;">
        Your household account is active.
        ${isPrimary ? "You are the billing account holder." : "You're set up as a household member."}
        Use the credentials below to sign in.
      </p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">
          Email
        </p>
        <p style="margin: 0 0 12px; font-family: ui-monospace, monospace; font-size: 14px;">
          ${escapeHtml(email)}
        </p>
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">
          Temporary password
        </p>
        <p style="margin: 0; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 700;">
          ${escapeHtml(password)}
        </p>
      </div>
      <p style="margin: 0 0 16px; color: #52525b;">
        For your security, change this password the first time you sign in.
      </p>
      <p style="margin: 24px 0 0;">
        <a href="${loginUrl}" style="background: #f97316; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; display: inline-block; font-weight: 600;">
          Sign in to your account
        </a>
      </p>
    </div>
  `;
}
