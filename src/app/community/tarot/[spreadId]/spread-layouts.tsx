"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// ─── Shared Types ─────────────────────────────────────────────────────────────

interface DrawnCard {
  card: { id: string; name: string; description: string | null; image_url: string | null };
}

interface LayoutProps {
  positionLabels: string[];
  drawnCards: (DrawnCard | null)[];
  onReveal: (index: number) => void;
  onCardClick?: (card: DrawnCard) => void;
  cardBackUrl: string;
}

// ─── Shared Card Slot Component ───────────────────────────────────────────────

function CardSlot({
  index,
  label,
  drawn,
  onReveal,
  onCardClick,
  cardBackUrl,
  cardWidth = 150,
  cardHeight = 220,
  rotateCard = false,
}: {
  index: number;
  label: string;
  drawn: DrawnCard | null;
  onReveal: (index: number) => void;
  onCardClick?: (card: DrawnCard) => void;
  cardBackUrl: string;
  cardWidth?: number;
  cardHeight?: number;
  rotateCard?: boolean;
}) {
  const isRevealed = drawn !== null;

  // Label height proportional to card — old site was 155px for 348px image (44%)
  const labelHeight = Math.round(cardHeight * 0.4);

  return (
    <div
      className={`group flex flex-col items-center cursor-pointer ${rotateCard ? "rotate-90" : ""}`}
      style={{ width: cardWidth }}
      onClick={() => {
        if (isRevealed && onCardClick) {
          onCardClick(drawn);
        } else if (!isRevealed) {
          onReveal(index);
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isRevealed && onCardClick) {
            onCardClick(drawn);
          } else if (!isRevealed) {
            onReveal(index);
          }
        }
      }}
      aria-label={isRevealed ? `View ${drawn.card.name} full size` : `Click to reveal ${label}`}
    >
      {/* Card image area */}
      <div
        className="relative overflow-hidden rounded-t-lg border-[3px] border-b-0 border-[#343a45] group-hover:border-indigo-400/60 transition-colors duration-300"
        style={{ width: cardWidth, height: cardHeight, background: isRevealed ? "#000" : "#2a2e37" }}
      >
        {isRevealed ? (
          <img
            src={drawn.card.image_url ?? ""}
            alt={drawn.card.name}
            className="h-full w-full object-contain animate-[fadeIn_0.5s_ease-in]"
          />
        ) : (
          <img
            src={cardBackUrl}
            alt="Card back"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {/* Label area — white panel below card like old site */}
      <div
        className="flex flex-col items-center justify-center text-center rounded-b-lg border-[3px] border-t-0 border-[#343a45] group-hover:border-indigo-400/60 transition-colors duration-300"
        style={{
          width: cardWidth,
          minHeight: labelHeight,
          background: "linear-gradient(to bottom, #f0f0f0, #ffffff)",
        }}
      >
        <span className="font-bold text-red-600" style={{ fontSize: Math.max(24, cardWidth * 0.16) }}>
          {index + 1}
        </span>
        <span
          className="font-medium text-black leading-tight px-2 line-clamp-2"
          style={{ fontSize: Math.max(11, cardWidth * 0.075) }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── 1. Three Card Basic Question (3 cards in a row) ──────────────────────────

export function ThreeCardLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  return (
    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
      {positionLabels.map((label, i) => (
        <CardSlot
          key={i}
          index={i}
          label={label}
          drawn={drawnCards[i]}
          onReveal={onReveal}
          onCardClick={onCardClick}
          cardBackUrl={cardBackUrl}
          cardWidth={200}
          cardHeight={290}
        />
      ))}
    </div>
  );
}

// ─── 2. Five Card Complex Question (5 in a row with group brackets) ──────────

export function FiveCardLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  // Layout: 5 cards in a row
  // Group labels below: [0,1] = INSIDE, [2,3] = OUTSIDE, [4] = RESULT
  // Bottom bar: "NATURE OF THE PROBLEM / Environment" | "POSSIBLE SOLUTIONS"
  return (
    <div className="flex flex-col items-center gap-6">
      {/* 5 cards in a row */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={170} cardHeight={250} />
        ))}
      </div>
      {/* Group labels */}
      <div className="hidden md:flex justify-center gap-0 w-full max-w-[850px]">
        <div className="flex-1 text-center border-t-2 border-l-2 border-emerald-500/60 pt-2 ml-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Inside</span>
        </div>
        <div className="flex-1 text-center border-t-2 border-emerald-500/60 pt-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Outside</span>
        </div>
        <div className="w-[160px] text-center border-t-2 border-r-2 border-emerald-500/60 pt-2 mr-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Result</span>
        </div>
      </div>
      {/* Bottom bar */}
      <div className="hidden md:flex justify-center gap-4 w-full max-w-[850px]">
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nature of the Problem</p>
          <p className="text-xs text-muted-foreground/70">Environment</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Possible Solutions</p>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Seven Card Horseshoe (inverted U-shape) ──────────────────────────────

export function HorseshoeLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  // Visual (inverted U):
  //   [0]                          [6]
  //       [1]                  [5]
  //            [2]        [4]
  //                 [3]
  const CW = 160;
  const CH = 230;
  // Total card height = image + label (~40%) + borders
  const totalH = CH + Math.round(CH * 0.4) + 10;
  const ROW_GAP = totalH + 20; // each row starts after previous card fully ends + 20px spacing
  return (
    <div className="relative mx-auto" style={{ width: 1000, minHeight: ROW_GAP * 3 + totalH }}>
      {/* Desktop: absolute positioning */}
      <div className="hidden lg:block relative" style={{ height: ROW_GAP * 3 + totalH }}>
        {/* Row 0: top — far left and far right */}
        <div className="absolute" style={{ left: 0, top: 0 }}>
          <CardSlot index={0} label={positionLabels[0]} drawn={drawnCards[0]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
        <div className="absolute" style={{ right: 0, top: 0 }}>
          <CardSlot index={6} label={positionLabels[6]} drawn={drawnCards[6]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
        {/* Row 1: stepped inward */}
        <div className="absolute" style={{ left: '13%', top: ROW_GAP }}>
          <CardSlot index={1} label={positionLabels[1]} drawn={drawnCards[1]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
        <div className="absolute" style={{ right: '13%', top: ROW_GAP }}>
          <CardSlot index={5} label={positionLabels[5]} drawn={drawnCards[5]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
        {/* Row 2: more inward */}
        <div className="absolute" style={{ left: '26%', top: ROW_GAP * 2 }}>
          <CardSlot index={2} label={positionLabels[2]} drawn={drawnCards[2]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
        <div className="absolute" style={{ right: '26%', top: ROW_GAP * 2 }}>
          <CardSlot index={4} label={positionLabels[4]} drawn={drawnCards[4]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
        {/* Row 3: bottom center */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: ROW_GAP * 3 }}>
          <CardSlot index={3} label={positionLabels[3]} drawn={drawnCards[3]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
      </div>
      {/* Tablet */}
      <div className="hidden md:flex lg:hidden flex-wrap justify-center gap-6">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={140} cardHeight={200} />
        ))}
      </div>
      {/* Mobile */}
      <div className="flex md:hidden flex-wrap justify-center gap-4">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={120} cardHeight={170} />
        ))}
      </div>
    </div>
  );
}

// ─── 4. Seven Card 6 Month Forward Review (star/radial) ──────────────────────

export function ForwardReviewLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  const CW = 150;
  const CH = 220;
  return (
    <div className="flex flex-col items-center gap-10">
      {/* Top row: 3 cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {[0, 1, 2].map((i) => (
          <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        ))}
      </div>
      {/* Middle row: 2 cards wider apart */}
      <div className="flex flex-wrap justify-center gap-20">
        {[3, 4].map((i) => (
          <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        ))}
      </div>
      {/* Bottom row: 2 cards */}
      {positionLabels.length > 5 && (
        <div className="flex flex-wrap justify-center gap-6">
          {[5, 6].filter((i) => i < positionLabels.length).map((i) => (
            <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 5. Ten Card Relationship (diamond pattern) ──────────────────────────────

export function RelationshipLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  // Old site layout — diamond/triangle shape:
  //   [5 Beliefs]              [9 Outcome]        ← raised wings
  //              [8 Hopes]                        ← centered lower
  //   [0] [1] [2] [3] [4]                        ← full width row
  //          [6]     [7]                          ← centered bottom
  const CW = 140;
  const CH = 200;

  return (
    <div className="flex flex-col items-center">
      {/* Desktop */}
      <div className="hidden md:flex flex-col items-center gap-6">
        {/* Top section: 6 and 10 raised, 9 lower between them */}
        <div className="relative w-full" style={{ maxWidth: 800, height: CH + CH * 0.4 + 80 }}>
          {/* Card 6 (Beliefs) — top left */}
          <div className="absolute" style={{ left: 0, top: 0 }}>
            <CardSlot index={5} label={positionLabels[5]} drawn={drawnCards[5]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>
          {/* Card 9 (Hopes/Fears) — center, pushed down */}
          <div className="absolute" style={{ left: '50%', transform: 'translateX(-50%)', top: 60 }}>
            <CardSlot index={8} label={positionLabels[8]} drawn={drawnCards[8]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>
          {/* Card 10 (Outcome) — top right */}
          <div className="absolute" style={{ right: 0, top: 0 }}>
            <CardSlot index={9} label={positionLabels[9]} drawn={drawnCards[9]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>
        </div>

        {/* Middle row: 5 cards spread across full width */}
        <div className="flex justify-center gap-3" style={{ maxWidth: 900 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          ))}
        </div>

        {/* Bottom row: 2 cards centered */}
        <div className="flex justify-center gap-8">
          {[6, 7].map((i) => (
            <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          ))}
        </div>
      </div>

      {/* Mobile: 2 columns */}
      <div className="grid md:hidden grid-cols-2 gap-4 justify-items-center">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={120} cardHeight={170} />
        ))}
      </div>
    </div>
  );
}

// ─── 6. Ten Card Celtic Cross (cross + staff) ────────────────────────────────

export function CelticCrossLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  // Simple grid approach matching old site visual:
  //  Row 1:              [4]                    [9]
  //  Row 2:     [3]      [0]      [5]          [8]
  //  Row 3:              [1]                    [7]
  //  Row 4:              [2]                    [6]
  // Card 1 (Problem) placed below card 0, no rotation

  const CW = 140;
  const CH = 200;
  const SCW = 130;
  const SCH = 180;

  return (
    <div className="flex flex-col items-center">
      {/* Desktop: grid layout */}
      <div className="hidden lg:flex justify-center gap-10">
        {/* Cross: 3 columns */}
        <div className="flex gap-4 items-start">
          {/* Left column: card 3 centered vertically */}
          <div className="flex flex-col justify-center" style={{ minHeight: (CH + CH * 0.4 + 10) * 3 }}>
            <CardSlot index={3} label={positionLabels[3]} drawn={drawnCards[3]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>

          {/* Center column: 4, 0, 1, 2 stacked */}
          <div className="flex flex-col items-center gap-3">
            <CardSlot index={4} label={positionLabels[4]} drawn={drawnCards[4]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
            <CardSlot index={0} label={positionLabels[0]} drawn={drawnCards[0]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
            <CardSlot index={1} label={positionLabels[1]} drawn={drawnCards[1]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
            <CardSlot index={2} label={positionLabels[2]} drawn={drawnCards[2]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>

          {/* Right column: card 5 centered vertically */}
          <div className="flex flex-col justify-center" style={{ minHeight: (CH + CH * 0.4 + 10) * 3 }}>
            <CardSlot index={5} label={positionLabels[5]} drawn={drawnCards[5]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>
        </div>

        {/* Staff: 4 cards stacked vertically */}
        <div className="flex flex-col gap-3">
          {[9, 8, 7, 6].map((i) => (
            <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={SCW} cardHeight={SCH} />
          ))}
        </div>
      </div>

      {/* Tablet / Mobile */}
      <div className="flex lg:hidden flex-wrap justify-center gap-4">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={120} cardHeight={170} />
        ))}
      </div>
    </div>
  );
}

// ─── 7. Twelve Card Astrological (zodiac circle) ─────────────────────────────

export function AstrologicalLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  // Old site layout: 6 vertical pairs forming a zodiac wheel
  // grp1: [0 Aries (left)] — [6 Libra (right)]     horizontal axis, centered vertically
  // grp2: [11 Pisces (top-left inner)] — [1 Taurus (bottom-left inner)]
  // grp3: [10 Aquarius (top-left outer)] — [2 Gemini (bottom-left outer)]
  // grp4: [9 Capricorn (top center)] — [3 Cancer (bottom center)]   vertical axis
  // grp5: [8 Sagittarius (top-right outer)] — [4 Leo (bottom-right outer)]
  // grp6: [7 Scorpio (top-right inner)] — [5 Virgo (bottom-right inner)]
  const CW = 150;
  const CH = 210;

  // Layout: 7 columns evenly spaced — Aries, Pisces/Taurus, Aquarius/Gemini, Cap/Cancer, Sag/Leo, Scorpio/Virgo, Libra
  // Each column is CW (150px), gap between columns ~30px
  // Total width = 7 columns * 150px + 6 gaps * 30px = 1230px
  // Using percentage-based left positions for each column center
  // Col positions (% of container): 0=0%, 1=16.6%, 2=33.3%, 3=50%, 4=66.6%, 5=83.3%, 6=100%

  return (
    <div className="flex flex-col items-center">
      {/* Desktop: zodiac wheel */}
      <div className="hidden lg:block relative mx-auto" style={{ width: 1150, height: 1700 }}>

        {/* Col 3 (center): Capricorn (top) + Cancer (bottom) — full height */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col justify-between items-center" style={{ height: 1700 }}>
          <CardSlot index={9} label={positionLabels[9]} drawn={drawnCards[9]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={3} label={positionLabels[3]} drawn={drawnCards[3]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 2: Aquarius (top) + Gemini (bottom) */}
        <div className="absolute flex flex-col justify-between items-center" style={{ left: '33%', transform: 'translateX(-50%)', top: '13%', height: '74%' }}>
          <CardSlot index={10} label={positionLabels[10]} drawn={drawnCards[10]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={2} label={positionLabels[2]} drawn={drawnCards[2]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 4: Sagittarius (top) + Leo (bottom) */}
        <div className="absolute flex flex-col justify-between items-center" style={{ left: '67%', transform: 'translateX(-50%)', top: '13%', height: '74%' }}>
          <CardSlot index={8} label={positionLabels[8]} drawn={drawnCards[8]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={4} label={positionLabels[4]} drawn={drawnCards[4]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 1: Pisces (top) + Taurus (bottom) — inner left */}
        <div className="absolute flex flex-col justify-between items-center" style={{ left: '17%', transform: 'translateX(-50%)', top: '24%', height: '52%' }}>
          <CardSlot index={11} label={positionLabels[11]} drawn={drawnCards[11]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={1} label={positionLabels[1]} drawn={drawnCards[1]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 5: Scorpio (top) + Virgo (bottom) — inner right */}
        <div className="absolute flex flex-col justify-between items-center" style={{ left: '83%', transform: 'translateX(-50%)', top: '24%', height: '52%' }}>
          <CardSlot index={7} label={positionLabels[7]} drawn={drawnCards[7]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={5} label={positionLabels[5]} drawn={drawnCards[5]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 0 + Col 6: Aries (left) + Libra (right) — horizontal axis */}
        <div className="absolute w-full flex justify-between items-center" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <CardSlot index={0} label={positionLabels[0]} drawn={drawnCards[0]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={6} label={positionLabels[6]} drawn={drawnCards[6]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
      </div>

      {/* Tablet: 4x3 grid */}
      <div className="hidden md:grid lg:hidden grid-cols-4 gap-6 justify-items-center">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={140} cardHeight={200} />
        ))}
      </div>

      {/* Mobile: 2 columns */}
      <div className="grid md:hidden grid-cols-2 gap-4 justify-items-center">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={130} cardHeight={190} />
        ))}
      </div>
    </div>
  );
}

// ─── Generic Fallback Layout (for unknown spreads) ───────────────────────────

export function GenericLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {positionLabels.map((label, i) => (
        <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={160} cardHeight={230} />
      ))}
    </div>
  );
}

// ─── Layout Selector ─────────────────────────────────────────────────────────

export function SpreadLayout({
  spreadName,
  cardCount,
  ...restProps
}: Omit<LayoutProps, "onCardClick"> & { spreadName: string; cardCount: number }) {
  const [lightboxCard, setLightboxCard] = useState<DrawnCard | null>(null);
  const name = spreadName.toLowerCase();

  const props: LayoutProps = {
    ...restProps,
    onCardClick: (card) => setLightboxCard(card),
  };

  let layout: React.ReactNode;

  if (cardCount === 3 || name.includes("3 card")) {
    layout = <ThreeCardLayout {...props} />;
  } else if (name.includes("5 card") || name.includes("complex")) {
    layout = <FiveCardLayout {...props} />;
  } else if (name.includes("horseshoe")) {
    layout = <HorseshoeLayout {...props} />;
  } else if (name.includes("6 month") || name.includes("forward review")) {
    layout = <ForwardReviewLayout {...props} />;
  } else if (name.includes("relationship")) {
    layout = <RelationshipLayout {...props} />;
  } else if (name.includes("celtic cross")) {
    layout = <CelticCrossLayout {...props} />;
  } else if (name.includes("astrological") || cardCount === 12) {
    layout = <AstrologicalLayout {...props} />;
  } else {
    layout = <GenericLayout {...props} />;
  }

  return (
    <>
      {layout}
      <Dialog open={!!lightboxCard} onOpenChange={(open) => !open && setLightboxCard(null)}>
        <DialogContent className="max-w-md p-2 bg-black/95 border-none">
          {lightboxCard && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={lightboxCard.card.image_url ?? ""}
                alt={lightboxCard.card.name}
                className="w-full h-auto max-h-[75vh] object-contain rounded"
              />
              <p className="text-center text-sm font-semibold text-white">{lightboxCard.card.name}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
