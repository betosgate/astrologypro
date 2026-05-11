import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CommunityProfileForm } from "@/components/community/profile-form";
import { SectionContainer } from "@/components/shared/section-container";
import { headers } from "next/headers";
import { APP_URL } from "@/lib/constants";

export const metadata = { title: "Profile - AstrologyPro" };

type PmApiSubscription = {
  current_period_end: string | null;
  last_payment_date?: string | null;
  cancel_at_period_end: boolean;
  status: string;
};

async function fetchPmSubscription(): Promise<PmApiSubscription | null> {
  try {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
    const protocol =
      hdrs.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") ? "http" : "https");
    const origin = host ? `${protocol}://${host}` : APP_URL;
    const cookie = hdrs.get("cookie");

    const res = await fetch(`${origin}/api/pm/subscription`, {
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    });

    if (!res.ok) {
      console.error("[community/profile] Failed to fetch PM subscription API", res.status);
      return null;
    }
    const body = await res.json();
    console.log("[community/profile] /api/pm/subscription", {
      route: "/community/profile",
      status: res.status,
      subscription_status: body.subscription?.status ?? null,
      current_period_end: body.subscription?.current_period_end ?? null,
      last_payment_date: body.subscription?.last_payment_date ?? null,
      cancel_at_period_end: body.subscription?.cancel_at_period_end ?? null,
    });
    return body.subscription ?? null;
  } catch (err) {
    console.error("[community/profile] PM subscription API error:", err);
    return null;
  }
}

export default async function CommunityProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Task 04 (community-horoscope-birth-country):
  // `birth_country` is required for the shared Horoscope Toolkit but was
  // previously not loaded from `community_members`, so the profile form
  // could not hydrate or save it. The column is provisioned by migration
  // `20260422000006_add_birth_country_to_community_members.sql` and the
  // `/api/community/onboarding/complete` route already persists it — we
  // just need to select + pass it through.
  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, first_name, last_name, email, phone, gender, date_of_birth, birth_time, birth_city, birth_country, address, city, state, zip, relationship_status, intake_data, membership_type, membership_status, joined_at, expires_at, current_period_end")
    .eq("user_id", user.id)
    .single();


  if (!member) redirect("/get-started");

  const { data: selfFamilyMember } = await supabase
    .from("community_family_members")
    .select("birth_lat, birth_lng")
    .eq("member_id", member.id)
    .or(`user_id.eq.${user.id},relationship.ilike.self`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const memberWithSelfCoordinates = {
    ...member,
    birth_lat: selfFamilyMember?.birth_lat ?? null,
    birth_lng: selfFamilyMember?.birth_lng ?? null,
  };

  memberWithSelfCoordinates.joined_at =
    memberWithSelfCoordinates.joined_at &&
    memberWithSelfCoordinates.joined_at.trim() !== ""
      ? memberWithSelfCoordinates.joined_at
      : user.created_at;

  if (memberWithSelfCoordinates.membership_type !== "mystery_school") {
    const pmSub = await fetchPmSubscription();
    if (pmSub) {
      if (pmSub.current_period_end) {
        memberWithSelfCoordinates.current_period_end = pmSub.current_period_end;
      }
      if (pmSub.last_payment_date) {
        (
          memberWithSelfCoordinates as typeof memberWithSelfCoordinates & {
            last_payment_date?: string | null;
          }
        ).last_payment_date =
          pmSub.last_payment_date;
      }
      if (pmSub.status) memberWithSelfCoordinates.membership_status = pmSub.status;
      if (pmSub.cancel_at_period_end) {
        memberWithSelfCoordinates.membership_status = "cancelling";
      }
    }
  }

  // Community Journey Progress reads the avatar off auth.users.user_metadata,
  // so that is the source of truth for this form too.
  const rawAvatarUrl = user.user_metadata?.avatar_url;
  const initialAvatarUrl =
    typeof rawAvatarUrl === "string" && rawAvatarUrl.trim() !== ""
      ? rawAvatarUrl
      : null;

  return (
    <SectionContainer verticalPadding="none" className="px-0 sm:px-0 lg:px-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your membership details</p>
        </div>


        <CommunityProfileForm
          member={memberWithSelfCoordinates}
          userId={user.id}
          initialAvatarUrl={initialAvatarUrl}
        />
      </div>
    </SectionContainer>
  );
}
