import Link from "next/link";
import { notFound } from "next/navigation";
import { WALKTHROUGH_SECTIONS } from "@/lib/walkthrough-data";
import ScreenshotLightbox from "../_components/screenshot-lightbox";
import { ChevronRight, LayoutDashboard, Layers, MousePointer2 } from "lucide-react";

export function generateStaticParams() {
  return WALKTHROUGH_SECTIONS.map((section) => ({
    role: section.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const section = WALKTHROUGH_SECTIONS.find((s) => s.slug === role);
  if (!section) return {};

  return {
    title: `${section.role} Walkthrough — AstrologyPro`,
    description: section.roleDescription,
  };
}

export default async function RoleWalkthroughPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const section = WALKTHROUGH_SECTIONS.find((s) => s.slug === role);

  if (!section) {
    notFound();
  }

  // Navigation logic
  const roleIndex = WALKTHROUGH_SECTIONS.findIndex((s) => s.slug === role);
  const prevSection = roleIndex > 0 ? WALKTHROUGH_SECTIONS[roleIndex - 1] : null;
  const nextSection = roleIndex < WALKTHROUGH_SECTIONS.length - 1 ? WALKTHROUGH_SECTIONS[roleIndex + 1] : null;

  // Group counts for stats
  const totalScreens = section.screens.length;
  const totalGroups = new Set(section.screens.map(s => s.group)).size;

  return (
    <div className="cosmic-bg noise-overlay min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12 relative z-10">
      {/* Breadcrumbs */}
      <nav className="mb-10 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link href="/walkthrough" className="hover:text-amber-500 transition-colors">
          Walkthrough Hub
        </Link>
        <ChevronRight className="size-3 opacity-40" />
        <span className="text-foreground">{section.role}</span>
      </nav>

      {/* Hero Section */}
      <header className="mb-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-col items-start gap-3">
              <div className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${section.gradient} px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground ring-1 ring-white/10`}>
              <section.icon className="size-3 text-amber-500" />
              {section.role} Portal
              </div>
              <span
                className="inline-flex rounded-xl px-4 py-2 text-xl font-bold tracking-tight text-black sm:text-2xl"
                style={{
                  background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
                  boxShadow: "0 8px 20px rgba(205,145,47,0.15)",
                }}
              >
                {section.role}
              </span>
            </div>
            <p className="mt-4 text-lg font-medium text-amber-500/80">
              {section.tagline}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground font-medium">
              {section.roleDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:flex-nowrap">
            <div className="flex flex-col rounded-xl border border-white/5 bg-card/40 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Screens</span>
              <span className="text-xl font-bold text-foreground">{totalScreens}</span>
            </div>
            <div className="flex flex-col rounded-xl border border-white/5 bg-card/40 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Modules</span>
              <span className="text-xl font-bold text-foreground">{totalGroups}</span>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {section.capabilities.map((cap) => (
            <div key={cap} className="flex items-start gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              <p className="text-xs font-medium text-muted-foreground">{cap}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content (Lightbox + Side Nav) */}
      <main className="relative min-h-[600px]">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <h2 className="text-lg font-bold text-foreground">Feature Gallery</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MousePointer2 className="size-3" />
            Click images to expand
          </span>
        </div>

        <ScreenshotLightbox 
          screens={section.screens} 
          roleSlug={section.slug} 
          roleTitle={section.role} 
        />
      </main>

      {/* Bottom Navigation */}
      <footer className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-white/10 pt-12 sm:flex-row">
        {prevSection ? (
          <Link 
            href={`/walkthrough/${prevSection.slug}`}
            className="group flex items-center gap-4 transition-all"
          >
            <div className="flex size-10 items-center justify-center rounded-full border border-white/10 group-hover:bg-amber-500/10 group-hover:border-amber-500/30">
              <ChevronRight className="size-5 rotate-180 text-muted-foreground group-hover:text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-amber-500/60">Previous Role</p>
              <p className="text-sm font-semibold text-foreground group-hover:text-amber-500">{prevSection.role}</p>
            </div>
          </Link>
        ) : <div />}

        <Link 
          href="/walkthrough"
          className="rounded-full bg-white/5 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-white/10 hover:text-amber-500 transition-all ring-1 ring-white/10"
        >
          View All Portals
        </Link>

        {nextSection ? (
          <Link 
            href={`/walkthrough/${nextSection.slug}`}
            className="group flex flex-row-reverse items-center gap-4 transition-all"
          >
            <div className="flex size-10 items-center justify-center rounded-full border border-white/10 group-hover:bg-amber-500/10 group-hover:border-amber-500/30">
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-amber-500" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-amber-500/60">Next Role</p>
              <p className="text-sm font-semibold text-foreground group-hover:text-amber-500">{nextSection.role}</p>
            </div>
          </Link>
        ) : <div />}
      </footer>
      </div>
    </div>
  );
}
