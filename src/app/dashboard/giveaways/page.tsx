import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Gift, Plus, Users, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiveawayDrawButton } from "@/components/dashboard/giveaway-draw-button";

export const metadata = { title: "Giveaways" };

type GiveawayStatus = "draft" | "active" | "ended" | "cancelled";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  status: GiveawayStatus;
  starts_at: string | null;
  ends_at: string | null;
  winner_count: number;
  entry_count: number;
  winner_count_selected: number;
  created_at: string;
}

function statusBadgeVariant(status: GiveawayStatus) {
  switch (status) {
    case "active":
      return "default";
    case "ended":
      return "secondary";
    case "draft":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDateRange(starts: string | null, ends: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (starts && ends) return `${fmt(starts)} – ${fmt(ends)}`;
  if (starts) return `Starts ${fmt(starts)}`;
  if (ends) return `Ends ${fmt(ends)}`;
  return "No dates set";
}

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

  const enriched: Giveaway[] = giveaways.map((g) => ({
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

      {/* Empty state */}
      {enriched.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Gift className="size-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No giveaways yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create one to engage your live audience. Viewers check in and
                enter automatically.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/giveaways/new">
                <Plus className="mr-2 size-4" />
                Create Your First Giveaway
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enriched.map((g) => {
            const canDraw =
              (g.status === "active" || g.status === "ended") &&
              g.winner_count_selected === 0 &&
              g.entry_count > 0;

            return (
              <Card key={g.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{g.title}</CardTitle>
                    <Badge variant={statusBadgeVariant(g.status)} className="shrink-0 capitalize">
                      {g.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {g.prize_description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-xs text-muted-foreground">
                    {formatDateRange(g.starts_at, g.ends_at)}
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="size-3.5" />
                      {g.entry_count} {g.entry_count === 1 ? "entry" : "entries"}
                    </span>
                    {g.winner_count_selected > 0 && (
                      <span className="flex items-center gap-1 text-sm text-amber-600">
                        <Trophy className="size-3.5" />
                        {g.winner_count_selected}{" "}
                        {g.winner_count_selected === 1 ? "winner" : "winners"}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/dashboard/giveaways/${g.id}`}>View Entries</Link>
                    </Button>
                    {canDraw && (
                      <GiveawayDrawButton giveawayId={g.id} giveawayTitle={g.title} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
