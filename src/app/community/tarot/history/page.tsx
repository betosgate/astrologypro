import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import tarotSpreads from "@/data/tarot-spreads";
import ReadingHistoryClient from "./ReadingHistoryClient";

export const metadata = { title: "My Reading History - AstrologyPro" };

interface SavedCard {
  position: number;
  position_name: string;
  card_name: string;
  is_reversed: boolean;
  keywords: string[];
  meaning: string;
}

export interface ReadingRow {
  id: string;
  spread_id: string;
  spread_name: string;
  created_at: string;
  notes: string | null;
  share_token: string | null;
  cards_preview: SavedCard[];
}

export default async function ReadingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ spread_id?: string; page?: string }>;
}) {
  const { spread_id, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = 20;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  const offset = (page - 1) * limit;
  let query = supabase
    .from("tarot_readings")
    .select("id, spread_id, spread_name, created_at, notes, share_token, cards", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (spread_id) query = query.eq("spread_id", spread_id);

  const { data, error, count } = await query;

  const readings: ReadingRow[] = (data ?? []).map((r) => ({
    id: r.id,
    spread_id: r.spread_id,
    spread_name: r.spread_name,
    created_at: r.created_at,
    notes: r.notes,
    share_token: r.share_token,
    cards_preview: Array.isArray(r.cards) ? (r.cards as SavedCard[]).slice(0, 3) : [],
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);
  const spreadOptions = tarotSpreads.map((s) => ({ slug: s.slug, name: s.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/community/tarot"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Spreads
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">My Readings</h1>
          {total > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {total} saved {total === 1 ? "reading" : "readings"}
            </p>
          )}
        </div>
      </div>

      {/* Filter row */}
      <form method="GET" className="flex flex-wrap items-center gap-3">
        <select
          name="spread_id"
          defaultValue={spread_id ?? ""}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filter by spread"
        >
          <option value="">All Spreads</option>
          {spreadOptions.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
        {spread_id && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/community/tarot/history">Clear</Link>
          </Button>
        )}
      </form>

      {error && (
        <div className="rounded-md border border-red-800/30 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          Failed to load readings.
        </div>
      )}

      {readings.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-indigo-800/40 py-16 text-center">
          <p className="text-muted-foreground">
            No readings saved yet. Start a reading to save it.
          </p>
          <Button asChild className="bg-indigo-700 hover:bg-indigo-600">
            <Link href="/community/tarot">Browse Spreads</Link>
          </Button>
        </div>
      )}

      {readings.length > 0 && (
        <>
          {/* Client island handles delete + share interactions */}
          <ReadingHistoryClient readings={readings} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/community/tarot/history?${spread_id ? `spread_id=${spread_id}&` : ""}page=${page - 1}`}
                  >
                    Previous
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/community/tarot/history?${spread_id ? `spread_id=${spread_id}&` : ""}page=${page + 1}`}
                  >
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
