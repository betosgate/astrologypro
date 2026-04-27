"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SpreadLayout } from "../spread-layouts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TarotCard {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface SpreadData {
  id: string;
  name: string;
  description: string | null;
  card_count: number;
  layout_json: { position_labels: string[] };
  image_url: string | null;
}

type ReadingState = "loading" | "error" | "drawing" | "revealed";

interface DrawnCard {
  card: TarotCard;
}

const CARD_BACK_URL =
  "https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/TarotCardBG.jpg";

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Main Page (Practice Mode — no saving) ───────────────────────────────────

export function TarotSpreadReadingPage({
  listHref = "/admin/tarot/readings",
}: {
  listHref?: string;
}) {
  const params = useParams<{ spreadId: string }>();

  const [state, setState] = useState<ReadingState>("loading");
  const [spread, setSpread] = useState<SpreadData | null>(null);
  const [allCards, setAllCards] = useState<TarotCard[]>([]);
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawIndex, setDrawIndex] = useState(0);
  const [drawnCards, setDrawnCards] = useState<(DrawnCard | null)[]>([]);
  const [revealedSlots, setRevealedSlots] = useState<Set<number>>(new Set());

  // Fetch spread + linked cards, then go straight to drawing
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/community/tarot/spreads/${params.spreadId}/cards`);
        if (!res.ok) { setState("error"); return; }
        const data = await res.json();
        setSpread(data.spread);
        setAllCards(data.cards);

        // Preload card images
        (data.cards as TarotCard[]).forEach((c) => {
          if (c.image_url) {
            const img = document.createElement("img");
            img.src = c.image_url;
          }
        });

        // Preload card back
        const backImg = document.createElement("img");
        backImg.src = CARD_BACK_URL;

        // Shuffle and go straight to drawing
        const positions = data.spread?.layout_json?.position_labels ?? [];
        const shuffled = shuffle([...data.cards]);
        setDeck(shuffled);
        setDrawnCards(Array(positions.length).fill(null));
        setDrawIndex(0);
        setRevealedSlots(new Set());
        setState("drawing");
      } catch {
        setState("error");
      }
    })();
  }, [params.spreadId]);

  const positionLabels = useMemo(
    () => spread?.layout_json?.position_labels ?? [],
    [spread],
  );
  const totalCards = positionLabels.length;

  const handleReveal = useCallback(
    (index: number) => {
      if (!spread || drawnCards[index] !== null) return;
      if (drawIndex >= deck.length) return;

      const card = deck[drawIndex];
      const drawn: DrawnCard = { card };

      setDrawnCards((prev) => {
        const next = [...prev];
        next[index] = drawn;
        return next;
      });
      setRevealedSlots((prev) => new Set(prev).add(index));
      setDrawIndex((prev) => prev + 1);

      const newRevealed = revealedSlots.size + 1;
      if (newRevealed >= totalCards) {
        setTimeout(() => setState("revealed"), 750);
      }
    },
    [spread, deck, drawIndex, drawnCards, revealedSlots, totalCards],
  );

  const handleNewReading = useCallback(() => {
    if (!allCards.length) return;
    const shuffled = shuffle([...allCards]);
    setDeck(shuffled);
    setDrawnCards(Array(totalCards).fill(null));
    setDrawIndex(0);
    setRevealedSlots(new Set());
    setState("drawing");
  }, [allCards, totalCards]);

  // ── Loading ──
  if (state === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-indigo-400/60" />
      </div>
    );
  }

  // ── Error ──
  if (state === "error" || !spread) {
    return (
      <div className="space-y-4 text-center py-16">
        <p className="text-lg font-semibold">Spread not found.</p>
        <Button asChild variant="outline">
          <Link href={listHref}>Browse Spreads</Link>
        </Button>
      </div>
    );
  }

  // ── Revealed — just show "Begin Another Reading" (practice mode, no save) ──
  if (state === "revealed") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href={listHref} className="text-sm text-muted-foreground hover:text-foreground">
              ← Tarot Practice
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{spread.name} — Complete</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-[#343a45] bg-[#1a1e27] p-6 md:p-10 overflow-hidden -mx-4 md:-mx-10 lg:-mx-16">
          <SpreadLayout
            spreadName={spread.name}
            cardCount={spread.card_count}
            positionLabels={positionLabels}
            drawnCards={drawnCards}
            onReveal={handleReveal}
            cardBackUrl={CARD_BACK_URL}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleNewReading} className="bg-indigo-700 hover:bg-indigo-600">
            Begin Another Reading
          </Button>
          <Button asChild variant="outline">
            <Link href={listHref}>All Spreads</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Drawing screen ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={listHref} className="text-sm text-muted-foreground hover:text-foreground">
            ← Tarot Practice
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{spread.name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleNewReading} className="text-muted-foreground">
          Start Over
        </Button>
      </div>

      <div className="rounded-2xl border border-[#343a45] bg-[#1a1e27] p-6 md:p-10 overflow-hidden">
        <SpreadLayout
          spreadName={spread.name}
          cardCount={spread.card_count}
          positionLabels={positionLabels}
          drawnCards={drawnCards}
          onReveal={handleReveal}
          cardBackUrl={CARD_BACK_URL}
        />
      </div>
    </div>
  );
}

export default function AdminSpreadReadingPage() {
  return <TarotSpreadReadingPage />;
}
