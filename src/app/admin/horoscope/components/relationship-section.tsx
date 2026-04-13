"use client";

import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { RELATIONSHIP_AI_SECTIONS } from "../constants";
import { SectionSkeleton, SectionError } from "./section-states";
import { ShowMoreModal, useShowMore } from "./show-more-modal";

export function RelationshipSection({ aiMap, areaOfInquiry, tabSlug, checkDacen, onDecanClick }: {
  aiMap: Record<string, any>; areaOfInquiry?: string; tabSlug: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
}) {
  const { modal, trigger, close } = useShowMore();
  const isBusiness = tabSlug === "business_partner_v2";

  function AiBlock({ title, sectionKey, data }: { title: string; sectionKey: string; data: any }) {
    if (!data && data !== "error") return <SectionSkeleton title={title} />;
    if (data === "error") return <SectionError title={title} />;
    const items: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    if (!items.length) return null;
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 horoscope-section-header text-center"><h3 className="text-sm font-semibold text-center w-full">{title}</h3></div>
        <div className="divide-y">
          {items.map((item: any, i: number) => (
            <div key={i} className="interp-gradient-default px-4 py-3" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-center">{item.title ?? item.name}</h4>
                {(() => {
                  const titleStr = String(item.title ?? item.name ?? "");
                  const match = titleStr.match(/(\b[A-Z][a-z]+\b)\s+in\s+(\b[A-Z][a-z]+\b)/);
                  if (match) {
                    const p = match[1];
                    const s = match[2];
                    if (checkDacen(p, s)) {
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onDecanClick(p, s)}
                              className="rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/dzuommtqurxx-removebg-preview.png"
                                alt=""
                                className="size-5 cursor-pointer hover:scale-125 transition-all hover:brightness-150 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20 shadow-xl">
                            Decan Information
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              <p className="leading-relaxed">{item.data ?? item.interpretation ?? item.description}</p>
              <div className="mt-1.5 flex justify-center">
                <button onClick={() => trigger(item.title ?? title, item.data ?? item.interpretation ?? "", item, areaOfInquiry)} className="horoscope-show-more">Show More</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sections = RELATIONSHIP_AI_SECTIONS.filter((s) => {
    if (s.key === "professional_alignment_and_goals") return isBusiness;
    if (s.key === "karmic_and_soulmate_indicators") return !isBusiness;
    return true;
  });

  return (
    <div className="space-y-4">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
      {sections.map((s) => (
        <AiBlock key={s.key} title={s.label} sectionKey={s.key} data={aiMap[s.key]} />
      ))}
    </div>
  );
}
