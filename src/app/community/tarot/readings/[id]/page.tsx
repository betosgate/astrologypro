import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SavedCard {
  position: number;
  position_name: string;
  card_name: string;
  is_reversed: boolean;
  keywords: string[];
  meaning: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReadingDetailPage({
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

  const { data: reading, error } = await supabase
    .from("tarot_readings")
    .select("id, user_id, spread_id, spread_name, cards, notes, share_token, created_at")
    .eq("id", id)
    .single();

  if (error || !reading) notFound();

  // Object-level authorization
  if (reading.user_id !== user.id) notFound();

  const cards = reading.cards as SavedCard[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/community/tarot/history"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Readings
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{reading.spread_name}</h1>
          <Badge variant="secondary" className="text-xs">
            {formatDate(reading.created_at)}
          </Badge>
        </div>
        {reading.share_token && (
          <p className="mt-1 text-xs text-emerald-400">
            Shareable link active ·{" "}
            <Link
              href={`/community/tarot/share/${reading.share_token}`}
              className="underline underline-offset-2"
            >
              view public page
            </Link>
          </p>
        )}
      </div>

      {/* Notes */}
      {reading.notes && (
        <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
            My Notes
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {reading.notes}
          </p>
        </div>
      )}

      {/* Card list */}
      <div className="space-y-5">
        {cards.map((c, i) => (
          <div key={c.position} className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {c.position}.
              </span>
              <span className="font-semibold text-sm">{c.position_name}</span>
            </div>

            <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/30 px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-indigo-100">
                  {c.is_reversed ? `Reversed: ${c.card_name}` : c.card_name}
                </span>
                {c.is_reversed && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/50 text-amber-400 text-xs"
                  >
                    Reversed
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {c.keywords.slice(0, 5).map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    {kw}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.meaning}</p>
            </div>

            {i < cards.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </div>

      <div className="pt-2 flex flex-wrap gap-3">
        <Button asChild className="bg-indigo-700 hover:bg-indigo-600">
          <Link href={`/community/tarot/${reading.spread_id}`}>Try This Spread</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/community/tarot/history">Back to History</Link>
        </Button>
      </div>
    </div>
  );
}
