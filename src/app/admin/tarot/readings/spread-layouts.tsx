"use client";

import React, { useEffect, useState } from "react";
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

function useMaxWidth(maxWidth: number) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, [maxWidth]);

  return matches;
}

// ─── Shared Card Slot Component ───────────────────────────────────────────────

function CardSlot({
  index,
  label,
  drawn,
  onReveal,
  onCardClick,
  cardBackUrl,
  cardWidth = 200,
  cardHeight = 290,
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

  return (
    <div
      className={`cursor-pointer ${rotateCard ? "rotate-90" : ""}`}
      style={{ width: cardWidth, height: cardHeight, perspective: 800 }}
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
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Back face (card back with overlay label) ── */}
        <div
          className="absolute inset-0 rounded-lg border-[3px] border-[#343a45] hover:border-indigo-400/60 transition-colors duration-300 overflow-hidden bg-[#2a2e37]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img
            src={cardBackUrl}
            alt="Card back"
            className="h-full w-full object-cover"
          />
          {/* Overlay label at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-3 px-2 text-center">
            <span className="block font-bold text-red-500" style={{ fontSize: Math.max(28, cardWidth * 0.18) }}>
              {index + 1}
            </span>
            <span className="block font-semibold text-white/90 leading-tight line-clamp-2" style={{ fontSize: Math.max(13, cardWidth * 0.085) }}>
              {label}
            </span>
          </div>
        </div>

        {/* ── Front face (revealed card image) ── */}
        <div
          className="absolute inset-0 rounded-lg border-[3px] border-[#343a45] hover:border-indigo-400/60 transition-colors duration-300 overflow-hidden bg-black"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {drawn && (
            <img
              src={drawn.card.image_url ?? ""}
              alt={drawn.card.name}
              className="h-full w-full object-contain"
            />
          )}
          {/* Overlay label at bottom of revealed card too */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-10 pb-3 px-2 text-center">
            <span className="block font-bold text-red-500" style={{ fontSize: Math.max(24, cardWidth * 0.15) }}>
              {index + 1}
            </span>
            <span className="block font-semibold text-white/90 leading-tight line-clamp-2" style={{ fontSize: Math.max(12, cardWidth * 0.08) }}>
              {label}
            </span>
          </div>
        </div>
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
  const CW = 160;
  const CH = 230;
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Card groups */}
      <div className="flex flex-wrap justify-center gap-6">
        {/* INSIDE group: cards 1 & 2 */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 border-b border-emerald-500/40 pb-1 px-4">Inside</h3>
          <div className="flex gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 max-[599px]:flex-col">
            {[0, 1].map((i) => (
              <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
            ))}
          </div>
        </div>

        {/* OUTSIDE group: cards 3 & 4 */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 border-b border-amber-500/40 pb-1 px-4">Outside</h3>
          <div className="flex gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 max-[599px]:flex-col">
            {[2, 3].map((i) => (
              <CardSlot key={i} index={i} label={positionLabels[i]} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
            ))}
          </div>
        </div>

        {/* RESULT group: card 5 */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 border-b border-indigo-500/40 pb-1 px-4">Result</h3>
          <div className="flex gap-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <CardSlot index={4} label={positionLabels[4]} drawn={drawnCards[4]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          </div>
        </div>
      </div>

      {/* Bottom labels */}
      <div className="hidden md:flex justify-center gap-8 w-full max-w-[900px]">
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nature of the Problem</p>
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
  const CW = 180;
  const CH = 260;
  // Total card height = image + label (~40%) + borders
  const totalH = CH + Math.round(CH * 0.2) + 0;
  const ROW_GAP = totalH + 0; // each row starts after previous card fully ends + 20px spacing
  return (
    <div className="relative mx-auto max-[1445px]:!w-full max-[1199px]:!min-h-auto" style={{ width: 1000, minHeight: ROW_GAP * 2.85 + totalH }}>
      {/* Desktop: absolute positioning */}
      <div className="block max-[1199px]:hidden relative max-[1199px]:!h-auto" style={{ height: ROW_GAP * 2.85 + totalH }}>
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
      <div className="hidden max-[1199px]:flex max-[768px]:hidden flex-wrap justify-center gap-6">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={140} cardHeight={200} />
        ))}
      </div>
      {/* Mobile */}
      <div className=" hidden max-[768px]:flex flex-wrap justify-center gap-4">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={120} cardHeight={170} />
        ))}
      </div>
    </div>
  );
}

// ─── 4. Seven Card 6 Month Forward Review (star/radial) ──────────────────────

export function ForwardReviewLayout({ positionLabels, drawnCards, onReveal, onCardClick, cardBackUrl }: LayoutProps) {
  // Old site: radial/star pattern with rotated cards
  // Card 7 (Clarity) at center, cards fan outward at angles
  // Positions from old Angular component:
  //   0 (Sunset): top-left, rotated 90deg
  //   6 (Clarity): top-center, normal
  //   1 (Horizon): top-right, rotated 90deg
  //   2 (Obstacle): bottom-left, rotated -135deg
  //   3 (Strength): top-right area, rotated 40deg
  //   5 (Navigation): bottom-left area, rotated 135deg
  //   4 (Advice): bottom-right area, rotated 133deg
  const CW = 180;
  const CH = 260;

  // Card positions: [left%, top%, rotation]
  const positions: [number, number, number][] = [
    [12, 20, -45],      // 0: Sunset (top-left, angled)
    [88, 20, 45],        // 1: Horizon (top-right, angled)
    [12, 75, -135],      // 2: Obstacle (bottom-left, angled)
    [88, 75, 135],       // 3: Strength (bottom-right, angled)
    [50, 88, 0],         // 4: Advice (bottom center, upright)
    [50, 12, 0],         // 5: Navigation (top center, upright)
    [50, 50, 0],         // 6: Clarity (center, upright)
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Desktop: radial/star layout */}
      <div className="block max-[1400px]:hidden relative mx-auto max-[1445px]:!w-full" style={{ width: 1000, height: 1200 }}>
        {positionLabels.map((label, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const [leftPct, topPct, rotation] = pos;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }}
            >
              <CardSlot index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
            </div>
          );
        })}
      </div>

      {/* Tablet / Mobile: simple grid fallback */}
      <div className="hidden max-[1400px]:flex flex-wrap justify-center gap-4">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={130} cardHeight={190} />
        ))}
      </div>
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
const is599OrBelow = useMaxWidth(399);
  const is1440OrBelow = useMaxWidth(1540);
  const CW = is599OrBelow ? 210 : is1440OrBelow ? 150 : 180;
  const CH = is599OrBelow ? 310 : is1440OrBelow ? 210 : 260;

  return (
    <div className="flex flex-col items-center">
      {/* Desktop */}
      <div className=" flex flex-col items-center gap-6 max-[1399px]:hidden">
        {/* Top section: 6 and 10 raised, 9 lower between them */}
        <div className="relative w-full max-[1540.98px]:!h-[272px]" style={{ maxWidth: 800, height: CH * 0 + 322 }}>
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
      <div className="hidden max-[1399px]:grid grid-cols-5 gap-4 justify-items-center max-[768px]:grid-cols-2 max-[399px]:grid-cols-1">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={120} cardHeight={170}/>
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

const is599OrBelow = useMaxWidth(337);
const is1440OrBelow = useMaxWidth(1540);

const CW = is599OrBelow ? 210 : is1440OrBelow ? 150 : 180;
const CH = is599OrBelow ? 310 : is1440OrBelow ? 210 : 260;

const SCW = CW;
const SCH = CH;

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
  const is599OrBelow = useMaxWidth(399);
  const is1440OrBelow = useMaxWidth(1540);
  const CW = is599OrBelow ? 210 : is1440OrBelow ? 150 : 180;
  const CH = is599OrBelow ? 310 : is1440OrBelow ? 210 : 260;

  // Layout: 7 columns evenly spaced — Aries, Pisces/Taurus, Aquarius/Gemini, Cap/Cancer, Sag/Leo, Scorpio/Virgo, Libra
  // Each column is CW (150px), gap between columns ~30px
  // Total width = 7 columns * 150px + 6 gaps * 30px = 1230px
  // Using percentage-based left positions for each column center
  // Col positions (% of container): 0=0%, 1=16.6%, 2=33.3%, 3=50%, 4=66.6%, 5=83.3%, 6=100%

  return (
    <div className="flex w-full flex-col items-center overflow-x-hidden">
      {/* Desktop: zodiac wheel */}
      <div className="relative mx-auto hidden w-full min-[1401px]:block" style={{ height: 1700 }}>

        {/* Col 3 (center): Capricorn (top) + Cancer (bottom) — full height */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(var(--spacing)*48)] flex flex-col justify-between items-center max-[1499px]:!top-[calc(var(--spacing)*73)] max-[1499px]:!h-[1120px]" style={{ height: 1370 }}>
          <CardSlot index={9} label={positionLabels[9]} drawn={drawnCards[9]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={3} label={positionLabels[3]} drawn={drawnCards[3]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 2: Aquarius (top) + Gemini (bottom) */}
        <div className="absolute flex flex-col justify-between items-center max-[1499px]:!top-[23%] max-[1499px]:!h-[55%]" style={{ left: '33%', transform: 'translateX(-50%)', top: '19%', height: '65%' }}>
          <CardSlot index={10} label={positionLabels[10]} drawn={drawnCards[10]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={2} label={positionLabels[2]} drawn={drawnCards[2]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 4: Sagittarius (top) + Leo (bottom) */}
        <div className="absolute flex flex-col justify-between items-center max-[1499px]:!top-[23%] max-[1499px]:!h-[55%]" style={{ left: '67%', transform: 'translateX(-50%)', top: '19%', height: '65%' }}>
          <CardSlot index={8} label={positionLabels[8]} drawn={drawnCards[8]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={4} label={positionLabels[4]} drawn={drawnCards[4]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 1: Pisces (top) + Taurus (bottom) — inner left */}
        <div className="absolute flex flex-col justify-between items-center max-[1499px]:!top-[30%] max-[1499px]:!h-[43%]" style={{ left: '17%', transform: 'translateX(-50%)', top: '27%', height: '49%' }}>
          <CardSlot index={11} label={positionLabels[11]} drawn={drawnCards[11]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={1} label={positionLabels[1]} drawn={drawnCards[1]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 5: Scorpio (top) + Virgo (bottom) — inner right */}

        <div className="absolute flex flex-col justify-between items-center max-[1499px]:!top-[30%] max-[1499px]:!h-[43%]" style={{ left: '83%', transform: 'translateX(-50%)', top: '27%', height: '49%' }}>
          <CardSlot index={7} label={positionLabels[7]} drawn={drawnCards[7]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={5} label={positionLabels[5]} drawn={drawnCards[5]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>

        {/* Col 0 + Col 6: Aries (left) + Libra (right) — horizontal axis */}
        <div className="absolute inset-x-0 flex items-center justify-between px-3" style={{ top: '51.3%', transform: 'translateY(-50%)' }}>
          <CardSlot index={0} label={positionLabels[0]} drawn={drawnCards[0]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
          <CardSlot index={6} label={positionLabels[6]} drawn={drawnCards[6]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={CW} cardHeight={CH} />
        </div>
      </div>

      {/* Tablet: 4x3 grid */}
      <div className="hidden w-full max-[1401px]:grid  grid-cols-4 gap-6 justify-items-center max-[768px]:hidden">
        {positionLabels.map((label, i) => (
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={140} cardHeight={200} />
        ))}
      </div>

      {/* Mobile: 2 columns */}
      <div className="grid md:hidden grid-cols-2 gap-4 justify-items-center max-[599px]:grid-cols-1">
        {positionLabels.map((label, i) =>(
          <CardSlot key={i} index={i} label={label} drawn={drawnCards[i]} onReveal={onReveal} onCardClick={onCardClick} cardBackUrl={cardBackUrl} cardWidth={is599OrBelow ? 210 : 130} cardHeight={is599OrBelow ? 310 : 190} />
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
