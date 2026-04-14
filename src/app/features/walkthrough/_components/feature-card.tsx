"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Info, CheckCircle2, Layout, Users } from "lucide-react";
import { type FeatureCard as FeatureType } from "@/lib/walkthrough-data";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  feature: FeatureType;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const screenshots = feature.screenshots || [];

  // Auto-rotate screenshots
  useEffect(() => {
    if (screenshots.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % screenshots.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [screenshots.length]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b16]/60 backdrop-blur-xl transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Screenshot Preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/20">
        {screenshots.length > 0 ? (
          <>
            {screenshots.map((src, idx) => (
              <div
                key={src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000",
                  idx === currentImageIndex ? "opacity-100" : "opacity-0"
                )}
              >
                <Image
                  src={`/walkthrough/screenshots/${src}.png`}
                  alt={`${feature.title} screenshot ${idx + 1}`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ))}
            
            {/* Carousel Dots */}
            {screenshots.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md">
                {screenshots.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      idx === currentImageIndex ? "w-4 bg-amber-400" : "w-1 bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5">
            <Layout className="size-10 text-white/10" />
          </div>
        )}
        
        {/* Role Badges */}
        <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
          {feature.roleSlugs?.map((role) => (
            <span 
              key={role}
              className="rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md"
            >
              {role}
            </span>
          ))}
        </div>
        
        {/* Live Badge */}
        {feature.status === "live" && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur-md">
            <div className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Live
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <feature.icon className="size-4 text-amber-500/80" />
              <h3 className="text-lg font-bold text-[#f5f0e8] group-hover:text-amber-400 transition-colors">
                {feature.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#b8bcd0]/70">
              {feature.description}
            </p>
          </div>
        </div>

        {/* Dynamic Detail List */}
        <div 
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            isExpanded ? "mt-5 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs font-medium text-[#c9cbd5]">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8186a0]">
              <Info className="size-3 text-amber-500/60" />
              Capability Points
            </p>
            {feature.bullets?.map((bullet) => (
              <div key={bullet} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-amber-500/50" />
                <span className="leading-relaxed">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group/btn flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-500/80 transition-colors hover:text-amber-400"
          >
            {isExpanded ? "Hide Details" : "Show Details"}
            <ChevronRight className={cn("size-3.5 transition-transform duration-300", isExpanded && "rotate-90")} />
          </button>
          
          <div className="flex items-center gap-1 text-[10px] font-medium text-white/30">
             <Users className="size-3" />
             {feature.roleSlugs?.length} Portals
          </div>
        </div>
      </div>
    </div>
  );
}
