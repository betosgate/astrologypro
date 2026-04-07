import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ArrowLeft,
  Gift,
  Users,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiveawayDrawButton } from "@/components/dashboard/giveaway-draw-button";
import { GiveawayStatusControl } from "@/components/dashboard/giveaway-status-control";

export const metadata = { title: "Giveaway Detail" };

type GiveawayStatus = "draft" | "active" | "ended" | "cancelled";

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
      return "outline" as const;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function GiveawayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  // Object-level auth: only the owning diviner can view
  const { data: giveaway } = await admin
    .from("giveaways")
    .select(
      "id, title, description, prize_description, status, starts_at, ends_at, winner_count, winner_selection, is_public, max_entries, created_at, updated_at"
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!giveaway) notFound();

  const { data: entries } = await admin
    .from("giveaway_entries")
    .select("id, name, email, is_winner, entered_at")
    .eq("giveaway_id", id)
    .order("entered_at", { ascending: false })
    .order("id", { ascending: false });

  const { data: winnerRows } = await admin
    .from("giveaway_winners")
    .select("id, selected_at, entry_id")
    .eq("giveaway_id", id);

  const allEntries = entries ?? [];
  const winners = winnerRows ?? [];
  const winnerEntryIds = new Set(winners.map((w) => w.entry_id));

  const canDraw =
    (giveaway.status === "active" || giveaway.status === "ended") &&
    winners.length === 0 &&
    allEntries.length > 0;

  const winnerEntry = allEntries.find((e) => winnerEntryIds.has(e.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/giveaways">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{giveaway.title}</h1>
              <Badge variant={statusBadgeVariant(giveaway.status as GiveawayStatus)} className="capitalize">
                {giveaway.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{giveaway.prize_description}</p>
          </div>
        </div>
      </div>

      {/* Info + Controls row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users className="size-4" /> Total Entries
            </CardDescription>
            <CardTitle className="text-3xl">{allEntries.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Trophy className="size-4" /> Winners Selected
            </CardDescription>
            <CardTitle className="text-3xl">{winners.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Date Range</CardDescription>
            <CardTitle className="text-sm font-medium">
              {giveaway.starts_at ? formatDate(giveaway.starts_at) : "—"}
              {" – "}
              {giveaway.ends_at ? formatDate(giveaway.ends_at) : "No end date"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Winner card */}
      {winnerEntry && (
        <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Trophy className="size-5" />
              Winner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold">{winnerEntry.name}</p>
            <p className="text-sm text-muted-foreground">{winnerEntry.email}</p>
            {winners[0] && (
              <p className="text-xs text-muted-foreground">
                Selected {formatDateTime(winners[0].selected_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <GiveawayStatusControl
          giveawayId={id}
          currentStatus={giveaway.status as GiveawayStatus}
        />
        {canDraw && (
          <GiveawayDrawButton giveawayId={id} giveawayTitle={giveaway.title} />
        )}
      </div>

      {/* Entries table */}
      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
          <CardDescription>
            {allEntries.length} {allEntries.length === 1 ? "entry" : "entries"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Users className="size-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">No entries yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Entries will appear here once viewers enter from your live session.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Entered At</TableHead>
                  <TableHead>Winner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={entry.is_winner ? "bg-amber-50/50 dark:bg-amber-950/10" : undefined}
                  >
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(entry.entered_at)}
                    </TableCell>
                    <TableCell>
                      {entry.is_winner ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <CheckCircle2 className="size-4" />
                          Winner
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
