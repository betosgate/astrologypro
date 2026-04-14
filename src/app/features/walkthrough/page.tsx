"use client";

import { useState, useMemo } from "react";
import { 
  PLATFORM_FEATURES, 
  WALKTHROUGH_SECTIONS, 
  getTotalFeatureCount 
} from "@/lib/walkthrough-data";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { FeatureCard } from "./_components/feature-card";
import { FeatureFilters } from "./_components/feature-filters";
import { Sparkles, Star, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeatureWalkthroughPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState<string | null>(null);

  // Statistics
  const totalFeatures = PLATFORM_FEATURES.length;
  const totalScreenshots = PLATFORM_FEATURES.reduce((sum, f) => sum + (f.screenshots?.length || 0), 0);
  const totalRoles = 8; // Based on ROLE_SLUGS length

  const filteredFeatures = useMemo(() => {
    return PLATFORM_FEATURES.filter((feature) => {
      const matchesSearch = 
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.bullets?.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = activeRole ? feature.roleSlugs?.includes(activeRole) : true;
      
      return matchesSearch && matchesRole;
    });
  }, [searchQuery, activeRole]);

  return (
    <div className="flex min-h-screen flex-col bg-[#05060f] text-[#f5f0e8]">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pb-20 pt-24 text-center sm:px-6 lg:px-8">
          {/* Background Decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-[10%] top-0 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
            <div className="absolute -right-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-orange-600/10 blur-[100px]" />
            <div className="absolute left-1/2 top-10 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-4xl">
            <div className="mx-auto flex h-fit w-fit items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <Sparkles className="size-3.5" />
              Complete System Walkthrough
            </div>
            
            <h1 className="mt-8 font-display text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Feature <span className="text-amber-500">Directory</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#b8bcd0]/80 sm:text-lg">
              A comprehensive technical and visual catalog of every module inside AstrologyPro. 
              Explore platform capabilities across all 8 stakeholder portals through interactive breakdowns.
            </p>

            {/* Quick Stats */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 backdrop-blur-md transition-colors hover:border-white/10 hover:bg-white/5">
                <span className="text-xl font-bold text-white">{totalFeatures}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8186a0]">Features</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 backdrop-blur-md transition-colors hover:border-white/10 hover:bg-white/5">
                <span className="text-xl font-bold text-white">{totalScreenshots}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8186a0]">Screenshots</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 backdrop-blur-md transition-colors hover:border-white/10 hover:bg-white/5">
                <span className="text-xl font-bold text-white">{totalRoles}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8186a0]">Role Portals</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="sticky top-[72px] z-30 border-y border-white/5 bg-[#05060f]/80 px-4 py-8 backdrop-blur-xl">
           <div className="mx-auto max-w-7xl">
             <FeatureFilters 
               searchQuery={searchQuery}
               setSearchQuery={setSearchQuery}
               activeRole={activeRole}
               setActiveRole={setActiveRole}
             />
           </div>
        </section>

        {/* Feature Grid */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
           {filteredFeatures.length > 0 ? (
             <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
               {filteredFeatures.map((feature) => (
                 <FeatureCard key={feature.title} feature={feature} />
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="rounded-full bg-white/5 p-6 ring-1 ring-white/10">
                 <Search className="size-10 text-white/20" />
               </div>
               <h3 className="mt-6 text-xl font-bold text-white">No features found</h3>
               <p className="mt-2 text-[#9ea5c0]/60">Try adjusting your search or portal filters.</p>
               <button 
                 onClick={() => { setSearchQuery(""); setActiveRole(null); }}
                 className="mt-6 text-sm font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400"
               >
                 Clear all filters
               </button>
             </div>
           )}
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-4 pb-32 pt-20 text-center">
           <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
             <Star className="size-3" />
             Always growing
           </div>
           <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
             Don't see what you're looking for?
           </h2>
           <p className="mt-4 text-base leading-relaxed text-[#b8bcd0]/70">
             We are constantly expanding the platform with new esoteric modules and administrative tools. 
             If you have a feature request or need a specific custom integration, we'd love to hear from you.
           </p>
           <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
             <a 
               href="mailto:support@astrologypro.com" 
               className="rounded-full bg-amber-500 px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
             >
               Request a Feature
             </a>
             <a 
               href="/walkthrough" 
               className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
             >
               View Role Index
             </a>
           </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
