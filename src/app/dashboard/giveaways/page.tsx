import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiveawayListClient } from "@/components/dashboard/giveaway-list-client";

export const metadata = { title: "Giveaways" };

export default async function GiveawaysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  const { data: rows } = await admin
    .from("giveaways")
    .select(
      "id, title, description, prize_description, status, starts_at, ends_at, winner_count, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  const giveaways = rows ?? [];
  const ids = giveaways.map((g) => g.id);

  let entryCounts: Record<string, number> = {};
  let winnerCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: entryData } = await admin
      .from("giveaway_entries")
      .select("giveaway_id")
      .in("giveaway_id", ids);

    if (entryData) {
      for (const row of entryData) {
        entryCounts[row.giveaway_id] = (entryCounts[row.giveaway_id] ?? 0) + 1;
      }
    }

    const { data: winnerData } = await admin
      .from("giveaway_winners")
      .select("giveaway_id")
      .in("giveaway_id", ids);

    if (winnerData) {
      for (const row of winnerData) {
        winnerCounts[row.giveaway_id] = (winnerCounts[row.giveaway_id] ?? 0) + 1;
      }
    }
  }

  const enriched = giveaways.map((g) => ({
    ...g,
    entry_count: entryCounts[g.id] ?? 0,
    winner_count_selected: winnerCounts[g.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Giveaways</h1>
            <p className="text-sm text-muted-foreground">
              Engage your live audience with prizes
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/giveaways/new">
            <Plus className="mr-2 size-4" />
            New Giveaway
          </Link>
        </Button>
      </div>

      <GiveawayListClient giveaways={enriched} />
    </div>
  );
}
