"use client";

import { Search, UserCircle2, Shield, Star, Heart, GraduationCap, Users } from "lucide-react";
import { ROLE_SLUGS } from "@/lib/walkthrough-data";
import { cn } from "@/lib/utils";

interface FeatureFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeRole: string | null;
  setActiveRole: (role: string | null) => void;
}

const ROLE_ICONS: Record<string, any> = {
  admin: Shield,
  diviner: Star,
  community: Heart,
  customer: UserCircle2,
  trainee: GraduationCap,
  public: Users,
  social_advo: Star, 
};

export function FeatureFilters({
  searchQuery,
  setSearchQuery,
  activeRole,
  setActiveRole,
}: FeatureFiltersProps) {
  const roles = Object.keys(ROLE_SLUGS).filter(r => r !== "mystery-school" && r !== "social_advo" || r === "social_advo"); // Filtering some for brevity or including all
  
  return (
    <div className="flex flex-col gap-8">
      {/* Search Input */}
      <div className="relative group mx-auto w-full max-w-2xl">
        <div className="absolute inset-0 -m-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-white/12 bg-[#090b16]/80 px-5 py-4 backdrop-blur-xl shadow-2xl transition-all group-focus-within:border-amber-500/40">
          <Search className="size-5 text-amber-500/60 transition-colors group-focus-within:text-amber-500" />
          <input
            type="text"
            placeholder="Search platform features (e.g. 'Natal', 'Booking', 'ROI')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-[#f5f0e8] placeholder:text-[#9ea5c0]/40 outline-none"
          />
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => setActiveRole(null)}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
            activeRole === null
              ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
              : "text-[#9ea5c0]/60 hover:bg-white/5 hover:text-[#f5f0e8]"
          )}
        >
          All Portals
        </button>
        <div className="h-4 w-px bg-white/10" />
        {Object.entries(ROLE_SLUGS).map(([slug, label]) => {
          const Icon = ROLE_ICONS[slug] || UserCircle2;
          const isActive = activeRole === slug;
          
          return (
            <button
              key={slug}
              onClick={() => setActiveRole(slug)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
                isActive
                  ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
                  : "text-[#9ea5c0]/60 hover:bg-white/5 hover:text-[#f5f0e8]"
              )}
            >
              <Icon className="size-3.5" />
              {label.split(" ")[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
