import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveUserBirthData } from "@/lib/community/birth-data-resolver";
import { buildToolkitPrefillForm } from "@/lib/horoscope-toolkit-prefill";
import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";

export const metadata = {
  title: "Detailed Monthly Transits - AstrologyPro Community",
};

export const dynamic = "force-dynamic";

export default async function CommunityTransitDetailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_type, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.membership_type !== "perennial_mandalism") {
    redirect("/community");
  }

  if (member.membership_status !== "active") {
    redirect("/join/community/resubscribe");
  }

  const resolved = await resolveUserBirthData(user.id, member.id, member.full_name);
  const prefill = await buildToolkitPrefillForm({
    person1: resolved,
  });

  return (
    <div className="space-y-4">
      <Link
        href="/community/transits"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to Monthly Transits
      </Link>

      <HoroscopeToolkitPage
        basePath="/community/transits/detailed"
        allowedSlugs={["tropical_transits_monthly_v3"]}
        initialPrefill={encodeURIComponent(JSON.stringify(prefill))}
      />
    </div>
  );
}
