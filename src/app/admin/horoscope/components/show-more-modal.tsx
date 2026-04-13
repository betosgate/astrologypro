"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X, Maximize2, Sparkles } from "lucide-react";
import { AstroHeaderParts, PlanetSymbol } from "./astro-icons";
import { fetchWithRetry } from "../api";
import { parseAspectTitle } from "../utils";
import { ASPECT_TYPE_WORDS } from "../constants";

// ─── Chart Image Modal ────────────────────────────────────────────────────────

export function ChartImageModal({ src, open, onClose }: { src: string; open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 z-[110] size-12 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:text-white transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)] group"
        aria-label="Exit Fullscreen"
      >
        <X className="size-7 transition-transform group-hover:rotate-90" />
      </button>

      <div className="h-full w-full overflow-auto flex items-center justify-center p-2 sm:p-4">
        {src.startsWith("<svg") ? (
          <div
            dangerouslySetInnerHTML={{ __html: src }}
            className="w-full h-full min-w-full min-h-full flex justify-center items-center scale-110"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Fullscreen Astrological Visualization"
            className="max-w-full max-h-full object-contain drop-shadow-[0_0_80px_rgba(245,158,11,0.15)] transition-transform duration-700 animate-in fade-in zoom-in-95"
          />
        )}

        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">Celestial Visualization Map</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Show More Modal ──────────────────────────────────────────────────────────

export function ShowMoreModal({ title, content, loading, open, onClose, aspectTitle, promptType, planetEntries, pictureUrl }: {
  title: string; content: string; loading: boolean; open: boolean; onClose: () => void;
  aspectTitle?: string;
  promptType?: "planet" | "house" | "aspect" | "generic";
  planetEntries?: { planet: string; items: string[] }[];
  pictureUrl?: string | null;
}) {
  const isAspect = promptType === "aspect" || !!aspectTitle;
  const { p1, aspectType, p2 } = isAspect ? parseAspectTitle(aspectTitle ?? title) : { p1: "", aspectType: "", p2: "" };
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    if (!open) setShowFullImage(false);
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-slate-950 border-white/10" showCloseButton={false}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 size-9 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400 transition-all active:scale-90 shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
            aria-label="Close modal"
          >
            <X className="size-5 transition-transform group-hover:rotate-90" />
          </button>

          <div className="px-6 py-5 border-b border-white/5 bg-slate-900/40 pr-16 shrink-0">
            <DialogHeader>
              {isAspect ? (
                <div className="pb-1">
                  <AstroHeaderParts title={aspectTitle ?? title} />
                </div>
              ) : (
                <DialogTitle className="text-lg font-bold capitalize gold-text">{title.replace(/_/g, " ")} (Pictorial Analysis)</DialogTitle>
              )}
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
            <div className="flex flex-col gap-0 h-full">
              <div className="p-6 shrink-0 border-b border-white/5">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-12 justify-center text-muted-foreground">
                    <Loader2 className="size-8 animate-spin text-amber-500 mb-2" />
                    <span className="text-sm font-medium tracking-widest uppercase opacity-70">Cosmic Retrieval...</span>
                  </div>
                ) : (
                  <div>
                    {promptType === "planet" && planetEntries && planetEntries.length > 0 ? (
                      <div className="space-y-6">
                        {planetEntries.map(({ planet, items }) => (
                          <div key={planet} className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 space-y-3 shadow-inner">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <PlanetSymbol name={planet} />
                              </div>
                              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                            </div>
                            <ol className="space-y-3 list-none">
                              {items.map((item, idx) => (
                                <li key={idx} className="text-sm leading-relaxed text-foreground/90 flex gap-3 group">
                                  <span className="flex-shrink-0 size-5 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px] border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-amber-950 transition-all">{idx + 1}</span>
                                  <span className="opacity-90 group-hover:opacity-100">{item}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-light tracking-wide bg-slate-900/40 p-6 rounded-2xl border border-white/5 italic relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40" />
                        <Sparkles className="absolute top-3 right-3 size-4 text-amber-500/20" />
                        &quot;{content}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {pictureUrl && (
                <div className="px-6 pb-6 pt-2 flex flex-col items-center justify-center bg-slate-900/20">
                  <div className="relative group rounded-xl border border-amber-500/20 overflow-hidden bg-slate-950 shadow-[0_0_50px_rgba(245,158,11,0.08)] transition-all hover:border-amber-500/40 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pictureUrl} alt={title} className="w-full h-auto max-h-[600px] object-contain transition-transform duration-1000 group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                    <button
                      onClick={() => setShowFullImage(true)}
                      className="absolute top-3 right-3 size-9 flex items-center justify-center rounded-lg bg-slate-950/80 border border-white/10 text-amber-500/80 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-2xl backdrop-blur-md z-10 group/btn"
                      title="Enlarge Cosmic Map"
                    >
                      <Maximize2 className="size-4 transition-transform group-hover/btn:scale-110" />
                    </button>

                    <div className="absolute bottom-3 left-0 right-0 text-center px-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-500/40 mix-blend-overlay">Celestial Configuration</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {pictureUrl && (
        <ChartImageModal
          src={pictureUrl}
          open={showFullImage}
          onClose={() => { setShowFullImage(false); onClose(); }}
        />
      )}
    </>
  );
}

// ─── useShowMore Hook ─────────────────────────────────────────────────────────

export function useShowMore() {
  const [modal, setModal] = useState<{
    title: string;
    content: string;
    loading: boolean;
    aspectTitle?: string;
    promptType?: "planet" | "house" | "aspect" | "generic";
    planetEntries?: { planet: string; items: string[] }[];
    pictureUrl?: string | null;
  } | null>(null);

  function buildPicturePayload(
    type: "planet" | "house" | "aspect" | "generic",
    title: string,
    promptData: any,
  ): { filename: string; foldername: string } | null {
    try {
      if (type === "aspect") {
        const parts = title.trim().split(/\s+/);
        if (parts.length >= 3) {
          return { filename: parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("-"), foldername: "aspect" };
        }
      } else if (type === "planet") {
        const p = promptData?.planet ?? promptData;
        const planet = p?.name ?? title.trim();
        const sign = p?.sign ?? p?.Sign ?? p?.[title.toLowerCase()]?.sign ?? p?.[title.toLowerCase()]?.Sign ?? "";
        if (planet && sign) {
          const capPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
          const capSign = sign.charAt(0).toUpperCase() + sign.slice(1);
          return { filename: `${capPlanet}-In-${capSign}`, foldername: "planets" };
        }
      } else if (type === "house") {
        const houseNum = promptData?.house ?? promptData?.House ?? "";
        const sign = promptData?.sign ?? promptData?.Sign ?? "";
        if (houseNum && sign) {
          const ordinal = String(houseNum).replace(/\D/g, "");
          const suffix = ordinal === "1" ? "st" : ordinal === "2" ? "nd" : ordinal === "3" ? "rd" : "th";
          const capSign = sign.charAt(0).toUpperCase() + sign.slice(1);
          return { filename: `${capSign}-In-${ordinal}${suffix}-House`, foldername: "house" };
        }
      }
    } catch { /* ignore */ }
    return null;
  }

  async function fetchPicture(
    type: "planet" | "house" | "aspect" | "generic",
    title: string,
    promptData: any,
  ): Promise<string | null> {
    const payload = buildPicturePayload(type, title, promptData);
    if (!payload) return null;
    try {
      const res = await fetchWithRetry("/api/admin/astro/astro-picture-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.status === "success" ? json.data?.url ?? null : null;
    } catch {
      return null;
    }
  }

  async function trigger(
    title: string,
    currentText: string,
    promptData: any,
    areaOfInquiry?: string,
    aspectTitle?: string,
    isKeyValue?: boolean,
    promptType?: "planet" | "house" | "aspect" | "generic",
  ) {
    const resolvedType = promptType ?? (aspectTitle ? "aspect" : "generic");
    setModal({ title, content: "", loading: true, aspectTitle, promptType: resolvedType, pictureUrl: null });

    const picturePromise = fetchPicture(resolvedType, aspectTitle ?? title, promptData);

    try {
      let aiPayload: any;

      if (resolvedType === "aspect" || aspectTitle) {
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
            user_content: "Generate western chart details only on aspects based on given json with atleast 8 sentences the json must be as {interpretation:data} where data in response from chatbot and it must be paragraph / string  but not object type (must not have any index in data or under interpretation index value) for sure.Response should not start with string 'json'  ever  and must be a valid json format  ",
          },
          toolname: "other",
          json: [promptData],
        };
      } else if (resolvedType === "planet") {
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
            user_content: "Generate western chart show more info  details only on planets based on given json with minimum 5 unique sentences on each planet and its significance with each of house position , full degree, norm degree , speed , sign in as much as detail possible all should be with in interpretation not in other index for sure . don't miss a single planet there are many please be careful  and response should not start with string 'json'  ever but in proper json format in correct json format and object in json will be {PlanetName:{1:text,2:text,3:text,4:text,5:text}} only (nothing else) response should be valid json .Response should not start with string 'json'  ever  and must be a valid json format",
          },
          toolname: "other",
          json: [promptData],
        };
      } else if (resolvedType === "house") {
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that house and under that interpretation",
            user_content: "Generate western chart details only on houses based on given json with minimum 5 sentences on each interpretation,only interpretation in json {interpretations:{data:text}} format where data is the text with 5 sentences.Response should not start with string 'json'  ever  and must be a valid json format",
          },
          toolname: "other",
          json: [promptData],
        };
      } else {
        aiPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that interpretation",
            user_content: "Generate western chart show more info based on given json with minimum 8 sentences the json must be as {interpretation:data} where data in response from chatbot and it must be paragraph / string  but not object type for sure.Response should not start with string 'json'  ever  and must be a valid json format  ",
          },
          toolname: "other",
          json: [promptData],
        };
      }

      const [aiResult, pictureResult] = await Promise.all([
        fetchWithRetry("/api/admin/astro/ai-interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiPayload, areaOfInquiry }),
        }).then(r => r.json()).catch(() => null),
        picturePromise,
      ]);

      let content = "";
      let planetEntries: { planet: string; items: string[] }[] = [];

      if (aiResult?.ai_response) {
        let raw: any;
        try {
          raw = typeof aiResult.ai_response === "string" 
            ? JSON.parse(aiResult.ai_response) 
            : aiResult.ai_response;
        } catch {
          raw = aiResult.ai_response;
        }

        if (resolvedType === "planet") {
          const entries: { planet: string; items: string[] }[] = [];
          
          // The AI might return { PlanetName: { 1: "...", 2: "..." } } or { interpretation: "..." }
          const dataToProcess = typeof raw === "object" && raw !== null ? raw : {};
          
          for (const [key, val] of Object.entries(dataToProcess)) {
            if (key === "interpretation" || typeof val === "string") {
              content = typeof val === "string" ? val : content;
              continue;
            }
            if (typeof val === "object" && val !== null) {
              const items = Object.values(val as Record<string, string>).filter(v => typeof v === "string");
              if (items.length) entries.push({ planet: key, items });
            }
          }
          if (entries.length) planetEntries = entries;
          else content = raw.interpretation ?? (typeof raw === "string" ? raw : JSON.stringify(raw));
        } else if (resolvedType === "house") {
          content = raw?.interpretations?.data ?? raw?.interpretation ?? (typeof raw === "string" ? raw : JSON.stringify(raw));
        } else {
          content = raw?.interpretation ?? (typeof raw === "string" ? raw : JSON.stringify(raw));
        }
      }

      setModal(prev => prev ? { ...prev, content, loading: false, planetEntries: planetEntries.length ? planetEntries : undefined, pictureUrl: pictureResult } : null);
    } catch (err) {
      setModal(prev => prev ? { ...prev, content: "Failed to retrieve detailed interpretation.", loading: false, pictureUrl: null } : null);
    }
  }

  function close() { setModal(null); }

  return { modal, trigger, close };
}
