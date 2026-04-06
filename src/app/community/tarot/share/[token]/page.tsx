import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tarot_readings")
    .select("spread_name, created_at")
    .eq("share_token", token)
    .single();

  if (!data) return { title: "Shared Reading - AstrologyPro" };
  return {
    title: `${data.spread_name} Reading - AstrologyPro`,
    description: `A shared tarot reading from ${formatDate(data.created_at)}`,
  };
}

export default async function SharedReadingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Use a service-role-capable client for the public read, or rely on the anon RLS policy.
  // The anon policy allows SELECT where share_token IS NOT NULL — we enforce the token match here.
  const supabase = await createClient();

  const { data: reading, error } = await supabase
    .from("tarot_readings")
    .select("id, spread_id, spread_name, cards, notes, share_token, created_at")
    .eq("share_token", token)
    .single();

  if (error || !reading) notFound();

  // Get the current viewer (may be null for anonymous)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cards = reading.cards as SavedCard[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="secondary" className="text-xs">Shared Reading</Badge>
        <h1 className="text-2xl font-bold tracking-tight">{reading.spread_name}</h1>
        <p className="text-sm text-muted-foreground">{formatDate(reading.created_at)}</p>
      </div>

      {/* Notes — show publicly if present */}
      {reading.notes && (
        <Card className="border-indigo-800/30 bg-indigo-950/20">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
              Reader's Notes
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {reading.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cards */}
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

      {/* CTA footer */}
      <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/20 px-4 py-4 space-y-3">
        <p className="text-sm font-medium text-indigo-200">
          Curious about this spread? Try it yourself.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-indigo-700 hover:bg-indigo-600">
            <Link href={`/community/tarot/${reading.spread_id}`}>
              Try This Spread
            </Link>
          </Button>
          {user ? (
            <Button asChild variant="outline">
              <Link href="/community/tarot/history">My Reading History</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Sign in to save readings</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
