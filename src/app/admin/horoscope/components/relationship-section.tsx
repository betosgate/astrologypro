"use client";

import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { RELATIONSHIP_AI_SECTIONS } from "../constants";
import { SectionSkeleton, SectionError } from "./section-states";
import { ShowMoreModal, useShowMore } from "./show-more-modal";

import { SmartHeading } from "./astro-icons";
import { cn } from "@/lib/utils";
import { getRelationshipBgClass } from "../utils";

export function RelationshipSection({ aiMap, areaOfInquiry, tabSlug, checkDacen, onDecanClick, rawData }: {
  aiMap: Record<string, any>; areaOfInquiry?: string; tabSlug: string;
  checkDacen: (p: string, s: string) => boolean;
  onDecanClick: (p: string, s: string) => void;
  rawData?: any;
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
        <div className="rounded-lg border overflow-hidden px-4 py-2.5 horoscope-section-header-dark flex items-center justify-center">
          <h3 className="text-sm font-semibold text-center w-full text-white">
            <SmartHeading title={title} textSize="text-[20px]" iconSize="size-7" className="text-white" />
          </h3>
        </div>

        {items.map((item: any, i: number) => {
          const itemTitle = item.title ?? item.name;
          const bgClass = getRelationshipBgClass(itemTitle ?? title, tabSlug, sectionKey);

          return (
            <div key={i} className="rounded-lg border overflow-hidden">
              {itemTitle && (
                <div className="px-4 py-3 horoscope-interp-header flex items-center justify-center border-b border-black/10 gap-5">
                  <SmartHeading title={itemTitle} textSize="text-[22px]" iconSize="size-7" className="text-[#000000]" />
                  {(() => {
                    const titleStr = String(itemTitle ?? title);
                    const match = titleStr.match(/(\b[A-Za-z\s]+\b)\s+in\s+(\b[A-Z][a-z]+\b)/);
                    if (match) {
                      const p = match[1].trim();
                      const s = match[2].trim();
                      if (checkDacen(p, s)) {
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onDecanClick(p, s)}
                                className="size-10 flex items-center justify-center rounded-full decan-accent-glow transition-all active:scale-90 group shrink-0"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="https://all-frontend-assets.s3.amazonaws.com/transcendentpagan/assets/images/dzuommtqurxx-removebg-preview.png"
                                  alt=""
                                  className="size-7 cursor-pointer transition-transform group-hover:scale-110 brightness-110 contrast-125"
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-amber-500/20 shadow-xl">
                              Decan Insights
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className={cn(bgClass, "px-4 py-3 pb-8")} style={{ fontFamily: "'Roboto', sans-serif", fontSize: '20px', fontWeight: 400, lineHeight: '26px' }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {!itemTitle && <h4 className="text-xs font-semibold uppercase tracking-wider text-center">{title}</h4>}
                </div>
                <p className="leading-relaxed">{item.data ?? item.interpretation ?? item.description}</p>
                <div className="mt-1.5 flex justify-center border-t border-black/10 pt-2">
                  <button onClick={() => trigger(itemTitle ?? title, item.data ?? item.interpretation ?? "", item, areaOfInquiry, undefined, false, undefined, tabSlug, rawData)} className="horoscope-show-more">Show More</button>
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
      <ShowMoreModal title={modal?.title ?? ""} content={modal?.content ?? ""} loading={modal?.loading ?? false} open={!!modal} onClose={close} aspectTitle={modal?.aspectTitle} promptType={modal?.promptType} planetEntries={modal?.planetEntries} relationshipEntries={modal?.relationshipEntries} bgClass={modal?.bgClass} pictureUrl={modal?.pictureUrl} />
      {sections.map((s) => (
        <AiBlock key={s.key} title={s.label} sectionKey={s.key} data={aiMap[s.key]} />
      ))}
    </div>
  );
}
