"use client";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X, Maximize2, Sparkles } from "lucide-react";
import { AstroHeaderParts, PlanetSymbol, SmartHeading } from "./astro-icons";
import { fetchWithRetry } from "../api";
import { parseAspectTitle, getMonthName, getRelationshipBgClass, getPlanetInterpClass } from "../utils";
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

export function ShowMoreModal({ title, content, loading, open, onClose, aspectTitle, promptType, planetEntries, relationshipEntries, bgClass, pictureUrl }: {
  title: string; content: string; loading: boolean; open: boolean; onClose: () => void;
  aspectTitle?: string;
  promptType?: "planet" | "house" | "aspect" | "generic";
  planetEntries?: { planet: string; items: string[]; bgClass?: string }[];
  relationshipEntries?: { title: string; content: string; bgClass?: string }[];
  bgClass?: string;
  pictureUrl?: string | null;
}) {
  const isAspect = promptType === "aspect" || !!aspectTitle;
  const { p1, aspectType, p2 } = isAspect ? parseAspectTitle(aspectTitle ?? title) : { p1: "", aspectType: "", p2: "" };
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    if (!open) setShowFullImage(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    
    // Prevent the inner result container from scrolling while modal is open
    const scrollContainer = document.querySelector(".result-scroll-container") as HTMLElement | null;
    if (scrollContainer) {
      const originalOverflow = scrollContainer.style.overflowY;
      scrollContainer.style.overflowY = "hidden";
      return () => {
        scrollContainer.style.overflowY = originalOverflow;
      };
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="sm:max-w-4xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-slate-950 border-white/10"
          showCloseButton={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 size-9 flex items-center justify-center rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-500 hover:bg-slate-800 hover:border-amber-500 hover:text-amber-400 transition-all active:scale-90 shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
            aria-label="Close modal"
          >
            <X className="size-5 transition-transform group-hover:rotate-90" />
          </button>

          <div className="px-6 pt-4 pb-0 pr-2 shrink-0 flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] gold-text text-center">
              Deep Astrological Analysis
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
            <div className="flex flex-col gap-0 h-full">
              <div className="pt-0 pb-6 px-6 shrink-0 border-b border-white/5">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-12 justify-center text-muted-foreground">
                    <Loader2 className="size-8 animate-spin text-amber-500 mb-2" />
                    <span className="text-sm font-medium tracking-widest uppercase opacity-70">Cosmic Retrieval...</span>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    {promptType === "planet" && planetEntries && planetEntries.length > 0 ? (
                      <div className="space-y-4">
                        {planetEntries.map(({ planet, items, bgClass: planetBgClass }) => (
                          <div key={planet} className="flex flex-col gap-5 items-center">
                             <div className="bg-white px-8 py-3.5 rounded-lg shadow-xl border border-black/5 text-center" style={{ width: "-webkit-fill-available" }}>
                               <SmartHeading title={planet} textSize="text-[20px]" iconSize="size-6" className="text-black" />
                             </div>
                             <div className={cn("w-full rounded-xl border border-black/10 pt-6 pb-2 px-8 space-y-4 shadow-2xl text-black", planetBgClass || getPlanetInterpClass(planet))}>
                                <ul className="space-y-4 list-none">
                                  {items.map((item, idx) => (
                                    <li key={idx} className="text-[18px] leading-relaxed flex gap-4 font-normal">
                                      <span className="flex-shrink-0 text-black font-bold text-[20px] leading-[28px]">&bull;</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : relationshipEntries && relationshipEntries.length > 0 ? (
                      <div className="space-y-4">
                        {relationshipEntries.map(({ title: entryTitle, content: entryContent, bgClass: entryBg }) => (
                          <div key={entryTitle} className="flex flex-col gap-5 items-center">
                             <div className="bg-white px-8 py-3.5 rounded-lg shadow-xl border border-black/5 text-center" style={{ width: "-webkit-fill-available" }}>
                               <h4 className="text-[20px] font-semibold text-black uppercase tracking-wide leading-tight">
                                 {entryTitle}
                               </h4>
                             </div>
                             <div className={cn("rounded-xl border border-black/10 pt-6 pb-2 px-8 shadow-2xl relative overflow-hidden text-black text-[19px] leading-[28px] font-normal", entryBg || "interp-gradient-default")}>
                                {entryContent}
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 items-center">
                        <div className="bg-white px-8 py-4 rounded-lg shadow-xl border border-black/5 text-center" style={{ width: "-webkit-fill-available" }}>
                           <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                             {isAspect ? (aspectTitle ?? title) : title.replace(/_/g, " ")}
                           </h2>
                        </div>
                        <div className={cn("rounded-xl border border-black/10 pt-6 pb-4 px-8 shadow-3xl text-black text-[19px] leading-[28px] font-normal relative overflow-hidden", bgClass || "interp-gradient-default")}>
                          {content}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {pictureUrl && (
                <div className="px-6 pb-6 pt-2 flex flex-col items-center justify-center bg-slate-900/20 gap-6">
                  <div className="bg-white px-8 py-3.5 rounded-lg shadow-xl border border-black/5 text-center mt-6" style={{ width: "-webkit-fill-available" }}>
                    <h4 className="text-[20px] font-semibold text-black uppercase tracking-wide leading-tight">
                      Picture Representation
                    </h4>
                  </div>
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
          onClose={() => { setShowFullImage(false); }}
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
    planetEntries?: { planet: string; items: string[]; bgClass?: string }[];
    relationshipEntries?: { title: string; content: string; bgClass?: string }[];
    bgClass?: string;
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
        let planet = p?.name ?? "";
        let sign = p?.sign ?? p?.Sign ?? p?.[title.toLowerCase()]?.sign ?? p?.[title.toLowerCase()]?.Sign ?? "";
        
        if (!planet || !sign) {
          const lower = title.toLowerCase();
          const planets = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "lilith", "chiron"];
          if (!planet) planet = planets.find(pl => lower.includes(pl)) || "";
          if (!sign) {
             const match = title.match(/in\s+([A-Za-z]+)/);
             if (match) sign = match[1];
          }
        }

        if (planet && sign) {
          const capPlanet = planet.charAt(0).toUpperCase() + planet.slice(1);
          const capSign = sign.charAt(0).toUpperCase() + sign.slice(1);
          return { filename: `${capPlanet}-In-${capSign}`, foldername: "planets" };
        }
      } else if (type === "house") {
        const h = promptData?.house ?? promptData?.House ?? promptData;
        let houseNum = h && typeof h === "object" ? (h.house || h.House || "") : (typeof h === "number" || typeof h === "string" ? h : "");
        let sign = promptData?.sign ?? promptData?.Sign ?? "";

        if (!houseNum || !sign) {
          const matchNum = title.match(/house\s+(\d+)/i) || title.match(/(\d+)(?:st|nd|rd|th)\s+house/i);
          if (matchNum) houseNum = matchNum[1];
          const matchSign = title.match(/in\s+([A-Za-z]+)/);
          if (matchSign) sign = matchSign[1];
        }

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
    tabSlug?: string,
    rawData?: any,
    horarySection?: "astrological_aspect" | "summary",
  ) {
    let resolvedType = promptType ?? (aspectTitle ? "aspect" : "generic");

    // Auto-detect type from title if generic
    if (resolvedType === "generic") {
      const lowerTitle = (aspectTitle ?? title).toLowerCase();
      if (ASPECT_TYPE_WORDS.some(w => lowerTitle.includes(w.toLowerCase()))) {
        resolvedType = "aspect";
      } else if (lowerTitle.includes(" house") || lowerTitle.startsWith("house ")) {
        resolvedType = "house";
      } else if (["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "lilith", "chiron"].some(p => lowerTitle.includes(p))) {
        // If it's a relationship tab, it might be a planet in sign/house
        resolvedType = "planet";
      }
    }
    setModal({ title, content: "", loading: true, aspectTitle, promptType: resolvedType, pictureUrl: null });

    const picturePromise = fetchPicture(resolvedType, aspectTitle ?? title, promptData);

    // ─── Horary-specific Show More (calls Lambda directly) ───────────────────
    const isHoraryTab = tabSlug === "horary_chart_v2";
    if (isHoraryTab && rawData) {
      try {
        const person1 = rawData.person1;
        const [bYear, bMonth, bDay] = (person1?.dob ?? "").split("-").map(Number);
        const [bHour, bMin] = (person1?.tob ?? "0:0").split(":").map(Number);
        const bLat  = person1?.city?.lat  ?? 0;
        const bLon  = person1?.city?.lng  ?? 0;
        const bTz   = person1?.city?.timezone?.offset_string ?? "+00:00";
        const bCity = typeof person1?.city === "object" ? (person1.city?.label ?? "") : (person1?.city ?? "");
        const question = rawData.question ?? areaOfInquiry ?? "";
        const sectionCtx = horarySection === "summary" ? "summary" : "astrological_aspect";
        const birthStr = `I was born on ${getMonthName(bMonth)} ${bDay}, ${bYear} time ${bHour}:${String(bMin ?? 0).padStart(2, "0")}, in ${bCity} ,'lat:${bLat},lon:${bLon},tzone:${bTz}'.`;

        const horaryPayload = {
          condition: {
            system_content: "give response only in json format as a whole , nothing else and always answer as astrolger not AI BOT",
            user_content: `${birthStr} and the qustion is '${question}'. Keeping western astrology in mind and here is  a summary of content "${currentText}" keeping this as main source info I need to know details of ${title} in ${sectionCtx} of horary astrology, and also need to know the significance and impact of ${title} in ${sectionCtx} of horary astrology in respect of the '${question}' in my life and as paragraph (this should be only focus in answer not theory of astrology on this specific aspect), you have planet , aspect and house info given in json, reposne must be in json format as {${title}:data} here data is dynamic data form bot and must be a paragraph with 3 sentences (minimum 3 paragraphs ) for ${title} in ${sectionCtx} of horary astrology make it real for me I don't need theory context in response you must add context of planet , aspect and house if any and make sure you parseable json in ai_response else recalculate the answer again. `,
          },
          toolname: "other",
          json: rawData.chartJson ?? promptData,
        };

        const [aiResult, pictureResult] = await Promise.all([
          fetchWithRetry("https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(horaryPayload),
          }).then(r => r.json()).catch(() => null),
          picturePromise,
        ]);

        let content = "";
        if (aiResult?.ai_response) {
          let responseStr = typeof aiResult.ai_response === "string"
            ? aiResult.ai_response
            : JSON.stringify(aiResult.ai_response);
          // Strip ```json ... ``` wrapper if present
          responseStr = responseStr.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
          let raw: any;
          try {
            raw = JSON.parse(responseStr);
          } catch {
            raw = responseStr;
          }
          if (raw && typeof raw === "object") {
            const firstKey = Object.keys(raw)[0];
            const val = raw[firstKey];
            if (typeof val === "string") {
              content = val;
            } else if (val && typeof val === "object") {
              content = (val as any).data ?? (val as any).interpretation ?? JSON.stringify(val);
            }
          } else {
            content = String(raw ?? "");
          }
        }

        setModal(prev => prev ? { ...prev, content, loading: false, bgClass: "interp-gradient-default", pictureUrl: pictureResult } : null);
      } catch {
        setModal(prev => prev ? { ...prev, content: "Failed to retrieve detailed interpretation.", loading: false, pictureUrl: null } : null);
      }
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
      let aiPayload: any;

      const isRelationshipTab = ["romantic_forecast_report_tropical_v2", "friendship_report_tropical_v2", "business_partner_v2"].includes(tabSlug || "");

      if (isRelationshipTab && rawData) {
        const p1 = rawData.person1_birth ?? rawData.mydetails ?? {};
        const p2 = rawData.person2_birth ?? rawData.fiend_details ?? {};
        const personaCity = typeof rawData.persona_city === "object" ? rawData.persona_city.label : (rawData.persona_city ?? "");
        const partnerCity = typeof rawData.partner_city === "object" ? rawData.partner_city.label : (rawData.partner_city ?? "");
        
        const b1Str = `I was born on ${getMonthName(p1.month)} ${p1.day}, ${p1.year}, ${p1.hour}:${String(p1.min ?? 0).padStart(2, "0")} in ${personaCity} 'lat:${p1.lat},lon:${p1.lon},tzone:${p1.tzone}'.`;
        const b2Str = `my partner was born on ${getMonthName(p2.month)} ${p2.day}, ${p2.year} ${p2.hour}:${String(p2.min ?? 0).padStart(2, "0")} at ${partnerCity} 'lat:${p2.lat},lon:${p2.lon},tzone:${p2.tzone}'.`;
        
        const context = tabSlug === "romantic_forecast_report_tropical_v2" ? "love" : tabSlug === "friendship_report_tropical_v2" ? "friendship" : "business partnership";

        aiPayload = {
          condition: {
            system_content: `give response only in json format as a whole , nothing else answer as astrolger not AI BOT. Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client’s unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.\n\nThe user has provided a specific "Area of Inquiry": "${areaOfInquiry || context}". Make this the central theme of your interpretation. While you should ground the reading in this context, also incorporate other relevant insights from the chart that support or add nuance to this primary focus. Conclude the response by explicitly summarizing how the various astrological insights tie back to the client’s stated area of inquiry.`,
            user_content: `${b1Str} ${b2Str} Keeping western astrology in mind and here is a summary of content "${currentText}" keeping this as main source info I need to know details of ${title} in ${context} as paragraph and also need to know the significance and impact in my life you have planet , aspect and house info given in json reposne must be in json format as {${title}:data} here data is dynamic data form bot and must be a paragraph with 5 sentences (minimum 6 paragraphs ) for ${title} in ${context} make it real for me I don't need theory context in response you must add context of planet , aspect and house if any `,
          },
          toolname: "other",
          json: {
            mydetails: p1,
            fiend_details: p2,
            item_data: promptData,
          },
        };
      } else if (resolvedType === "aspect" || aspectTitle) {
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
            system_content: "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation . Provide a deeply personalized response as if you are speaking directly to your astrology client in a one-on-one session. Use the language and tone of a trusted Western astrologer offering tailored guidance based on the client’s unique chart. Always interpret the chart using the Placidus house system as the default house_type. Avoid using generic phrases or repeated sentence structures. Each sentence should feel intentionally crafted and distinct, offering fresh insight without duplicating wording from similar interpretations.",
            user_content: "Generate western chart details only on only one house  provided in json with atleast 5 sentences on 3 paragraphs on each interpretation making sure mentioning significance of house , sign and degree in details , in json I need to see interpreation as index only and nothing else such as {interpretations:{data}} where is the content generated by astrologer and data is paragraph as text not json object and it must not have any inner index .Response should not start with string 'json'  ever  and must be a valid json format ",
          },
          toolname: "other",
          json: promptData,
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

      // picturePromise is already initialized at the start of trigger

      const [aiResult, pictureResult] = await Promise.all([
        fetchWithRetry("/api/admin/astro/ai-interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiPayload, areaOfInquiry }),
        }).then(r => r.json()).catch(() => null),
        picturePromise,
      ]);

      let content = "";
      let planetEntries: { planet: string; items: string[]; bgClass?: string }[] = [];
      let relationshipEntries: { title: string; content: string; bgClass?: string }[] = [];

      if (aiResult?.ai_response) {
        let raw: any;
        try {
          raw = typeof aiResult.ai_response === "string"
            ? JSON.parse(aiResult.ai_response)
            : aiResult.ai_response;
        } catch {
          raw = aiResult.ai_response;
        }

        if (resolvedType === "planet" && !isRelationshipTab) {
          const entries: { planet: string; items: string[]; bgClass?: string }[] = [];
          const dataToProcess = typeof raw === "object" && raw !== null ? raw : {};
          for (const [key, val] of Object.entries(dataToProcess)) {
            if (key === "interpretation" || typeof val === "string") {
              content = typeof val === "string" ? val : content;
              continue;
            }
            if (typeof val === "object" && val !== null) {
              const items = Object.values(val as Record<string, string>).filter(v => typeof v === "string");
              if (items.length) entries.push({ planet: key, items, bgClass: getPlanetInterpClass(key) });
            }
          }
          if (entries.length) planetEntries = entries;
          else content = raw.interpretation ?? (typeof raw === "string" ? raw : JSON.stringify(raw));
        } else if (resolvedType === "house" && !isRelationshipTab) {
          content = raw?.interpretations?.data ?? raw?.interpretation ?? (typeof raw === "string" ? raw : JSON.stringify(raw));
        } else if (isRelationshipTab && typeof raw === "object" && raw !== null) {
          const entries: { title: string; content: string }[] = [];
          for (const [key, val] of Object.entries(raw)) {
            let text = "";
            if (typeof val === "string") {
              text = val;
            } else if (typeof val === "object" && val !== null) {
              text = (val as any).data || (val as any).interpretation || (val as any).forecast || JSON.stringify(val);
            }
            if (text) {
               const bg = getRelationshipBgClass(key, tabSlug, undefined);
               relationshipEntries.push({ title: key, content: text, bgClass: bg });
            }
          }
          if (entries.length > 0) {
            relationshipEntries = entries;
            const main = entries.find(e => e.title.toLowerCase().includes(title.toLowerCase())) || entries[0];
            content = main.content;
          } else {
            content = typeof raw === "string" ? raw : JSON.stringify(raw);
          }
        } else {
          content = raw?.interpretation ?? (typeof raw === "string" ? raw : JSON.stringify(raw));
        }
      }

      // Calculate general bgClass for single-view fallback
      let bgClass = "";
      if (isRelationshipTab) {
        bgClass = getRelationshipBgClass(title, tabSlug, undefined);
      } else if (resolvedType === "planet") {
        bgClass = getPlanetInterpClass(title);
      } else if (resolvedType === "house") {
        bgClass = "interp-gradient-default";
      }

      setModal(prev => prev ? { 
        ...prev, 
        content, 
        loading: false, 
        planetEntries: planetEntries.length ? planetEntries : undefined, 
        relationshipEntries: relationshipEntries.length ? relationshipEntries : undefined,
        bgClass,
        pictureUrl: pictureResult 
      } : null);
    } catch (err) {
      setModal(prev => prev ? { ...prev, content: "Failed to retrieve detailed interpretation.", loading: false, pictureUrl: null } : null);
    }
  }

  function close() { setModal(null); }

  return { modal, trigger, close };
}
