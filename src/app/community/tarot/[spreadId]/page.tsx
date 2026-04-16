"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

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

interface SavedCard {
  position: number;
  position_name: string;
  card_name: string;
  is_reversed: boolean;
  keywords: string[];
  meaning: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

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

// ─── Reading Summary ──────────────────────────────────────────────────────────

function ReadingSummary({
  spread,
  drawnCards,
  positionLabels,
  onNewReading,
  onSave,
  savedReadingId,
  saveState,
}: {
  spread: SpreadData;
  drawnCards: (DrawnCard | null)[];
  positionLabels: string[];
  onNewReading: () => void;
  onSave: () => void;
  savedReadingId: string | null;
  saveState: SaveState;
}) {
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const handleSaveNotes = useCallback(async () => {
    if (!savedReadingId || !notes.trim()) return;
    setNotesSaving(true);
    try {
      await fetch(`/api/community/tarot/readings/${savedReadingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
    } finally {
      setNotesSaving(false);
    }
  }, [savedReadingId, notes]);

  const handleShare = useCallback(async () => {
    if (!savedReadingId) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/community/tarot/readings/${savedReadingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generate_share: true }),
      });
      const json = await res.json();
      const token: string = json.reading?.share_token;
      if (token) {
        setShareToken(token);
        const url = `${window.location.origin}/community/tarot/share/${token}`;
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } finally {
      setShareLoading(false);
    }
  }, [savedReadingId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">{spread.name} — Your Reading</h2>
        <Button variant="outline" size="sm" onClick={onNewReading}>
          New Reading
        </Button>
      </div>

      <div className="space-y-5">
        {positionLabels.map((label, i) => {
          const drawn = drawnCards[i];
          if (!drawn) return null;
          return (
            <div key={i} className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {i + 1}.
                </span>
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/30 px-4 py-3 space-y-3">
                <div className="flex items-start gap-4">
                  {drawn.card.image_url && (
                    <img
                      src={drawn.card.image_url}
                      alt={drawn.card.name}
                      className="w-16 h-24 rounded object-contain bg-black shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <span className="font-bold text-indigo-100">{drawn.card.name}</span>
                    {drawn.card.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {drawn.card.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save / Notes / Share */}
      <div className="rounded-lg border border-indigo-800/30 bg-indigo-950/20 px-4 py-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {saveState === "idle" && (
            <Button onClick={onSave} className="bg-indigo-700 hover:bg-indigo-600" size="sm">
              Save Reading
            </Button>
          )}
          {saveState === "saving" && (
            <Button disabled size="sm" className="bg-indigo-700/60">Saving…</Button>
          )}
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-700/40">
              ✓ Reading saved
            </span>
          )}
          {saveState === "error" && (
            <span className="text-xs text-red-400">Failed to save. Try again.</span>
          )}
          {saveState !== "idle" && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/community/tarot/history">View History</Link>
            </Button>
          )}
        </div>

        {saveState === "saved" && savedReadingId && (
          <div className="space-y-2">
            <label htmlFor="reading-notes" className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Add Notes
            </label>
            <Textarea
              id="reading-notes"
              placeholder="Write your personal reflections…"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              rows={3}
              className="resize-none bg-indigo-950/30 border-indigo-800/40 text-sm"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={notesSaving || !notes.trim()}>
                {notesSaving ? "Saving…" : "Save Notes"}
              </Button>
              {notesSaved && <span className="text-xs text-emerald-400">Notes saved.</span>}
            </div>
          </div>
        )}

        {saveState === "saved" && savedReadingId && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!shareToken ? (
              <Button size="sm" variant="outline" onClick={handleShare} disabled={shareLoading} className="border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/30">
                {shareLoading ? "Generating…" : "Share Reading"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const url = `${window.location.origin}/community/tarot/share/${shareToken}`;
                  await navigator.clipboard.writeText(url);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 3000);
                }}
                className="border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/30"
              >
                {shareCopied ? "Link Copied!" : "Copy Share Link"}
              </Button>
            )}
            {shareCopied && <span className="text-xs text-emerald-400">Copied to clipboard.</span>}
          </div>
        )}
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

  const [state, setState] = useState<ReadingState>("loading");
  const [spread, setSpread] = useState<SpreadData | null>(null);
  const [allCards, setAllCards] = useState<TarotCard[]>([]);
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawIndex, setDrawIndex] = useState(0); // next index in shuffled deck to pick from
  const [drawnCards, setDrawnCards] = useState<(DrawnCard | null)[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null);
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

        // Shuffle and go straight to drawing (no setup screen)
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

  // Click any empty slot to reveal — not forced sequential
  const handleReveal = useCallback(
    (index: number) => {
      if (!spread || drawnCards[index] !== null) return; // already drawn
      if (drawIndex >= deck.length) return; // no cards left in deck

      const card = deck[drawIndex];
      const drawn: DrawnCard = { card };

      setDrawnCards((prev) => {
        const next = [...prev];
        next[index] = drawn;
        return next;
      });
      setRevealedSlots((prev) => new Set(prev).add(index));
      setDrawIndex((prev) => prev + 1);

      // Check if all positions filled
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
    setSaveState("idle");
    setSavedReadingId(null);
    setState("drawing");
  }, [allCards, totalCards]);

  const handleSave = useCallback(async () => {
    if (!spread || saveState !== "idle") return;
    setSaveState("saving");

    const cards: SavedCard[] = positionLabels.map((label, i) => {
      const drawn = drawnCards[i];
      if (!drawn) return null;
      return {
        position: i + 1,
        position_name: label,
        card_name: drawn.card.name,
        is_reversed: false,
        keywords: [],
        meaning: drawn.card.description ?? "",
      };
    }).filter((c): c is SavedCard => c !== null);

    try {
      const res = await fetch("/api/community/tarot/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread_id: spread.id, spread_name: spread.name, cards }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setSavedReadingId(json.reading?.id ?? null);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [spread, drawnCards, saveState, positionLabels]);

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
          <Link href="/community/tarot">Browse Spreads</Link>
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
          positionLabels={positionLabels}
          onNewReading={handleNewReading}
          onSave={handleSave}
          savedReadingId={savedReadingId}
          saveState={saveState}
        />
      </div>
    );
  }

  // ── Drawing screen (main view — matches old site) ─────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/community/tarot" className="text-sm text-muted-foreground hover:text-foreground">
            ← Tarot Spreads
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{spread.name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleNewReading} className="text-muted-foreground">
          Start Over
        </Button>
      </div>

      {/* Card Grid — old site style */}
      <div className="rounded-2xl border border-[#343a45] bg-[#1a1e27] p-6 md:p-10">
        <div
          className="mx-auto flex flex-wrap justify-center gap-6"
        >
          {positionLabels.map((label, i) => {
            const drawn = drawnCards[i];
            const isRevealed = drawn !== null;

            return (
              <div key={i} className="flex flex-col items-center gap-2">
                {/* Card slot */}
                <div
                  className={`relative overflow-hidden rounded-lg border-[3px] transition-all duration-300 ${
                    isRevealed
                      ? "border-[#343a45] bg-black"
                      : "border-[#343a45] bg-[#2a2e37] cursor-pointer hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/10"
                  }`}
                  style={{ width: 150, height: 220 }}
                  onClick={() => !isRevealed && handleReveal(i)}
                  role={isRevealed ? undefined : "button"}
                  tabIndex={isRevealed ? undefined : 0}
                  onKeyDown={(e) => {
                    if (!isRevealed && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleReveal(i);
                    }
                  }}
                  aria-label={isRevealed ? `${label}: ${drawn.card.name}` : `Click to reveal ${label}`}
                >
                  {isRevealed ? (
                    /* Revealed card — show image with fade-in */
                    <img
                      src={drawn.card.image_url ?? ""}
                      alt={drawn.card.name}
                      className="h-full w-full object-contain animate-[fadeIn_0.5s_ease-in]"
                    />
                  ) : (
                    /* Card back */
                    <img
                      src={CARD_BACK_URL}
                      alt="Card back"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Position number + label below card */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-lg font-bold text-white">{i + 1}</span>
                  <span className="text-xs text-muted-foreground max-w-[140px] leading-tight">
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
