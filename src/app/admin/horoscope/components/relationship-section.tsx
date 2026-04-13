"use client";

import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { RELATIONSHIP_AI_SECTIONS } from "../constants";
import { SectionSkeleton, SectionError } from "./section-states";
import { ShowMoreModal, useShowMore } from "./show-more-modal";

import { SmartHeading } from "./astro-icons";
import { cn } from "@/lib/utils";

export function RelationshipSection({ aiMap, areaOfInquiry, tabSlug, checkDacen, onDecanClick }: {
  aiMap: Record<string, any>; areaOfInquiry?: string; tabSlug: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
}) {
  const { modal, trigger, close } = useShowMore();
  const isBusiness = tabSlug === "business_partner_v2";
  const isFriendship = tabSlug === "friendship_report_tropical_v2";

  function AiBlock({ title, sectionKey, data }: { title: string; sectionKey: string; data: any }) {
    if (!data && data !== "error") return <SectionSkeleton title={title} />;
    if (data === "error") return <SectionError title={title} />;
    const items: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    if (!items.length) return null;

    return (
      <div className="space-y-2">
        <div className="rounded-lg border overflow-hidden px-4 py-2.5 horoscope-section-header flex items-center justify-center">
          <h3 className="text-sm font-semibold text-center w-full text-white">
            <SmartHeading title={title} textSize="text-[20px]" iconSize="size-7" className="text-white" />
          </h3>
        </div>
        
        {items.map((item: any, i: number) => {
          const itemTitle = item.title ?? item.name;
          return (
            <div key={i} className="rounded-lg border overflow-hidden">
              {itemTitle && (
                <div className="px-4 py-3 horoscope-interp-header flex items-center justify-center border-b border-black/10">
                  <SmartHeading title={itemTitle} textSize="text-[22px]" iconSize="size-7" className="text-black" />
                </div>
              )}
              
              <div className="interp-gradient-default px-4 py-3 pb-8" style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px', color: '#000' }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {!itemTitle && <h4 className="text-xs font-semibold uppercase tracking-wider text-center">{title}</h4>}
                  {(() => {
                    const titleStr = String(itemTitle ?? title ?? "");
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
                <div className="mt-1.5 flex justify-center border-t border-black/10 pt-2">
                  <button onClick={() => trigger(itemTitle ?? title, item.data ?? item.interpretation ?? "", item, areaOfInquiry)} className="horoscope-show-more">Show More</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const sections = RELATIONSHIP_AI_SECTIONS.filter((s) => {
    if (s.key === "professional_alignment_and_goals") return isBusiness;
    if (s.key === "karmic_and_soulmate_indicators") return !isBusiness;
    return true;
  });

  return (
    <div className="space-y-12">
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} pictureUrl={modal?.pictureUrl} />
      {sections.map((s) => (
        <AiBlock key={s.key} title={s.label} sectionKey={s.key} data={aiMap[s.key]} />
      ))}
    </div>
  );
}
