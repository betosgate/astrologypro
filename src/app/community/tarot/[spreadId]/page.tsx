"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import tarotSpreads, { TarotSpread } from "@/data/tarot-spreads";
import tarotCards, { TarotCard } from "@/data/tarot-cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadingState = "setup" | "drawing" | "revealed";

interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
}

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Celtic Cross layout ──────────────────────────────────────────────────────
// Grid positions (row, col) for each card slot 1–10 in a 5×4 grid.
// The cross occupies columns 0-2; the staff occupies column 3.
const CELTIC_CROSS_GRID: [number, number][] = [
  [2, 1], // 1 – Present  (center)
  [2, 1], // 2 – Challenge (overlaid, handled by z-index in render)
  [4, 1], // 3 – Foundation (below center)
  [2, 0], // 4 – Recent Past (left)
  [0, 1], // 5 – Crown (above)
  [2, 2], // 6 – Near Future (right)
  [4, 3], // 7 – Attitude (staff bottom)
  [3, 3], // 8 – External Influences
  [2, 3], // 9 – Hopes and Fears
  [1, 3], // 10 – Outcome (staff top)
];

// ─── Card Face ────────────────────────────────────────────────────────────────

function CardFace({ drawn }: { drawn: DrawnCard }) {
  const { card, reversed } = drawn;
  const arcanaLabel =
    card.arcana === "major"
      ? "Major Arcana"
      : card.suit
      ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1)
      : "Minor Arcana";

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-indigo-950 px-1.5 py-2 text-center ring-1 ring-indigo-400/30 ${
        reversed ? "rotate-180" : ""
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-widest text-indigo-300">
        {arcanaLabel}
      </p>
      <p className="text-xs font-bold leading-tight text-indigo-50">
        {reversed ? "Rev." : ""} {card.name}
      </p>
      <p className="line-clamp-2 text-[9px] text-indigo-300/80">
        {card.keywords.slice(0, 2).join(" · ")}
      </p>
    </div>
  );
}

// ─── Card Back (face-down slot) ────────────────────────────────────────────────

function CardBack({
  position,
  onClick,
  disabled,
}: {
  position: number;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`Reveal card for position ${position}`}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative h-full w-full overflow-hidden rounded-lg border-2 border-indigo-700/50 bg-indigo-900/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
        disabled
          ? "cursor-default opacity-40"
          : "cursor-pointer hover:border-indigo-400/70 hover:bg-indigo-800/80"
      }`}
    >
      {/* shimmer */}
      {!disabled && (
        <span className="absolute inset-0 -translate-x-full animate-[card-shimmer_2s_linear_infinite] bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent" />
      )}
      <span className="absolute inset-0 flex items-center justify-center text-indigo-400/50 text-lg select-none">
        ✦
      </span>
      <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-medium text-indigo-400/60">
        {position}
      </span>
    </button>
  );
}

// ─── Flip card wrapper ─────────────────────────────────────────────────────────

function FlipCard({
  position,
  drawn,
  onReveal,
  drawingDisabled,
}: {
  position: number;
  drawn: DrawnCard | null;
  onReveal: () => void;
  drawingDisabled: boolean;
}) {
  return (
    <div className="perspective-[600px] h-full w-full">
      <div
        className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
          drawn ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Back */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <CardBack
            position={position}
            onClick={onReveal}
            disabled={drawingDisabled || drawn !== null}
          />
        </div>
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {drawn && <CardFace drawn={drawn} />}
        </div>
      </div>
    </div>
  );
}

// ─── Celtic Cross Layout ───────────────────────────────────────────────────────

function CelticCrossLayout({
  spread,
  drawnCards,
  onReveal,
  nextSlot,
}: {
  spread: TarotSpread;
  drawnCards: (DrawnCard | null)[];
  onReveal: (index: number) => void;
  nextSlot: number;
}) {
  // 5 rows × 4 cols grid, each cell 64×96px
  const ROWS = 5;
  const COLS = 4;
  const W = 64;
  const H = 96;
  const GAP = 8;

  // Card 2 (challenge) overlays card 1 rotated 90°
  return (
    <div
      className="relative mx-auto"
      style={{ width: COLS * (W + GAP) - GAP, height: ROWS * (H + GAP) - GAP }}
    >
      {spread.positions.map((pos, i) => {
        const [row, col] = CELTIC_CROSS_GRID[i];
        const isChallenge = i === 1;
        const drawn = drawnCards[i];
        const isNext = i === nextSlot;

        return (
          <div
            key={pos.number}
            className={`absolute ${isChallenge ? "rotate-90" : ""}`}
            style={{
              left: col * (W + GAP),
              top: row * (H + GAP),
              width: W,
              height: H,
              zIndex: i === 0 ? 1 : isChallenge ? 2 : 0,
            }}
          >
            <div className={`h-full w-full ${isNext && !drawn ? "ring-2 ring-indigo-400 ring-offset-2 rounded-lg" : ""}`}>
              <FlipCard
                position={pos.number}
                drawn={drawn}
                onReveal={() => onReveal(i)}
                drawingDisabled={i !== nextSlot}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Generic Grid Layout ──────────────────────────────────────────────────────

function GridLayout({
  spread,
  drawnCards,
  onReveal,
  nextSlot,
}: {
  spread: TarotSpread;
  drawnCards: (DrawnCard | null)[];
  onReveal: (index: number) => void;
  nextSlot: number;
}) {
  const count = spread.positions.length;
  // Up to 5 per row
  const cols = Math.min(count, 5);

  return (
    <div
      className="mx-auto grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, 64px)` }}
    >
      {spread.positions.map((pos, i) => {
        const drawn = drawnCards[i];
        const isNext = i === nextSlot;
        return (
          <div
            key={pos.number}
            className={`h-24 w-16 ${isNext && !drawn ? "ring-2 ring-indigo-400 ring-offset-2 rounded-lg" : ""}`}
          >
            <FlipCard
              position={pos.number}
              drawn={drawn}
              onReveal={() => onReveal(i)}
              drawingDisabled={i !== nextSlot}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Reading Summary ──────────────────────────────────────────────────────────

function ReadingSummary({
  spread,
  drawnCards,
  onNewReading,
}: {
  spread: TarotSpread;
  drawnCards: (DrawnCard | null)[];
  onNewReading: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{spread.name} — Your Reading</h2>
        <Button variant="outline" size="sm" onClick={onNewReading}>
          New Reading
        </Button>
      </div>

      <div className="space-y-5">
        {spread.positions.map((pos, i) => {
          const drawn = drawnCards[i];
          if (!drawn) return null;
          const { card, reversed } = drawn;
          const displayName = reversed ? `Reversed: ${card.name}` : card.name;
          const meaning = reversed ? card.reversedMeaning : card.uprightMeaning;
          const keywords = reversed ? card.reversedKeywords : card.keywords;

          return (
            <div key={pos.number} className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {pos.number}.
                </span>
                <span className="font-semibold text-sm">{pos.name}</span>
                <span className="text-xs text-muted-foreground">— {pos.meaning}</span>
              </div>

              <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/30 px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-indigo-100">{displayName}</span>
                  {reversed && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                      Reversed
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {keywords.slice(0, 5).map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {kw}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {meaning}
                </p>
              </div>

              {i < spread.positions.length - 1 && <Separator className="mt-4" />}
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex gap-3">
        <Button onClick={onNewReading} className="bg-indigo-700 hover:bg-indigo-600">
          Begin Another Reading
        </Button>
        <Button asChild variant="outline">
          <Link href="/community/tarot">All Spreads</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpreadReadingPage() {
  const params = useParams<{ spreadId: string }>();
  const spread = useMemo(
    () => tarotSpreads.find((s) => s.slug === params.spreadId),
    [params.spreadId]
  );

  const [state, setState] = useState<ReadingState>("setup");
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<(DrawnCard | null)[]>([]);
  const [nextSlot, setNextSlot] = useState(0);

  const handleShuffleAndBegin = useCallback(() => {
    if (!spread) return;
    const shuffled = shuffle([...tarotCards]);
    setDeck(shuffled);
    setDrawnCards(Array(spread.positions.length).fill(null));
    setNextSlot(0);
    setState("drawing");
  }, [spread]);

  const handleReveal = useCallback(
    (index: number) => {
      if (!spread || index !== nextSlot) return;
      const card = deck[nextSlot];
      const reversed = Math.random() < 0.2;
      const drawn: DrawnCard = { card, reversed };

      setDrawnCards((prev) => {
        const next = [...prev];
        next[index] = drawn;
        return next;
      });

      const newNext = nextSlot + 1;
      setNextSlot(newNext);

      if (newNext >= spread.positions.length) {
        // Small delay so last flip animation can complete before switching to revealed
        setTimeout(() => setState("revealed"), 750);
      }
    },
    [spread, deck, nextSlot]
  );

  const handleNewReading = useCallback(() => {
    setState("setup");
    setDeck([]);
    setDrawnCards([]);
    setNextSlot(0);
  }, []);

  // ── 404 ──
  if (!spread) {
    return (
      <div className="space-y-4 text-center py-16">
        <p className="text-lg font-semibold">Spread not found.</p>
        <Button asChild variant="outline">
          <Link href="/community/tarot">Browse Spreads</Link>
        </Button>
      </div>
    );
  }

  const revealedCount = drawnCards.filter(Boolean).length;
  const totalCards = spread.positions.length;
  const progressPct = totalCards > 0 ? Math.round((revealedCount / totalCards) * 100) : 0;

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (state === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/community/tarot"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Tarot Spreads
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{spread.name}</h1>
            <Badge
              variant={
                spread.difficulty === "Beginner"
                  ? "secondary"
                  : spread.difficulty === "Intermediate"
                  ? "outline"
                  : "default"
              }
            >
              {spread.difficulty}
            </Badge>
            <Badge variant="secondary">
              {spread.cardCount} {spread.cardCount === 1 ? "card" : "cards"}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">{spread.purpose}</p>
        </div>

        <Card className="border-indigo-800/30 bg-indigo-950/20">
          <CardContent className="pt-5">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-indigo-400 mb-2">
              Overview
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {spread.overview.split("\n\n")[0]}
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-800/30 bg-indigo-950/20">
          <CardContent className="pt-5 space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-indigo-400 mb-3">
              Card Positions
            </h2>
            {spread.positions.map((pos) => (
              <div key={pos.number} className="flex gap-3">
                <span className="min-w-[1.5rem] text-sm font-bold text-indigo-400">
                  {pos.number}.
                </span>
                <div>
                  <span className="text-sm font-semibold">{pos.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{pos.meaning}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-semibold"
          onClick={handleShuffleAndBegin}
        >
          Shuffle &amp; Begin
        </Button>
      </div>
    );
  }

  // ── Revealed screen ───────────────────────────────────────────────────────
  if (state === "revealed") {
    return (
      <div className="mx-auto max-w-3xl">
        <ReadingSummary
          spread={spread}
          drawnCards={drawnCards}
          onNewReading={handleNewReading}
        />
      </div>
    );
  }

  // ── Drawing screen ────────────────────────────────────────────────────────
  const isCelticCross = spread.slug === "celtic-cross";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/community/tarot"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tarot Spreads
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{spread.name}</h1>
        {nextSlot < totalCards && (
          <p className="mt-1 text-sm text-muted-foreground">
            Click card{" "}
            <span className="font-semibold text-indigo-400">
              {spread.positions[nextSlot].name}
            </span>{" "}
            (position {nextSlot + 1}) to reveal it.
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {revealedCount} of {totalCards} revealed
          </span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      {/* Layout */}
      <div className="py-4">
        {isCelticCross ? (
          <CelticCrossLayout
            spread={spread}
            drawnCards={drawnCards}
            onReveal={handleReveal}
            nextSlot={nextSlot}
          />
        ) : (
          <GridLayout
            spread={spread}
            drawnCards={drawnCards}
            onReveal={handleReveal}
            nextSlot={nextSlot}
          />
        )}
      </div>

      {/* Position legend */}
      <div className="grid gap-1.5 sm:grid-cols-2">
        {spread.positions.map((pos, i) => {
          const drawn = drawnCards[i];
          return (
            <div
              key={pos.number}
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
                drawn
                  ? "bg-indigo-950/40 text-indigo-200"
                  : i === nextSlot
                  ? "bg-indigo-900/40 ring-1 ring-indigo-500/40 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span className="min-w-[1.25rem] font-bold text-indigo-400">{pos.number}.</span>
              <div>
                <span className="font-semibold">{pos.name}</span>
                {drawn && (
                  <span className="ml-1 text-indigo-300/80">
                    — {drawn.reversed ? `Rev. ${drawn.card.name}` : drawn.card.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="ghost" size="sm" onClick={handleNewReading} className="text-muted-foreground">
        Start Over
      </Button>
    </div>
  );
}
