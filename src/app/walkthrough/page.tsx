import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  Globe,
  GraduationCap,
  Layers,
  ShoppingBag,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  WALKTHROUGH_SECTIONS,
  getTotalFeatureCount,
} from "@/lib/walkthrough-data";

export const metadata = {
  title: "Platform Walkthrough — AstrologyPro",
  description:
    "Explore every feature of the AstrologyPro platform across all roles — public pages, customer portal, community, mystery school, diviner dashboard, and admin back office.",
  openGraph: {
    title: "Platform Walkthrough — AstrologyPro",
    description:
      "Complete interactive guide to every feature across all AstrologyPro roles and portals.",
  },
};

export const dynamic = "force-dynamic";

// ─── Platform highlights ──────────────────────────────────────────────────

const PLATFORM_HIGHLIGHTS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Portals", value: "6", icon: Globe },
  { label: "Feature Pages", value: `${getTotalFeatureCount()}+`, icon: Layers },
  { label: "Role Types", value: "6", icon: Users },
  { label: "Astrology Tools", value: "6", icon: Star },
  { label: "Training Programs", value: "2", icon: GraduationCap },
  { label: "Commerce Modules", value: "4", icon: ShoppingBag },
];

// ─── Role card ────────────────────────────────────────────────────────────

function RoleCard({
  section,
}: {
  section: (typeof WALKTHROUGH_SECTIONS)[number];
}) {
  const Icon = section.icon;
  const totalCards = section.groups.reduce(
    (sum, g) => sum + g.cards.length,
    0,
  );
  const groupLabels = section.groups
    .map((g) => g.groupLabel)
    .filter(Boolean) as string[];

  return (
    <a
      href={`/walkthrough/${section.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="h-full border-border/40 bg-card/60 transition-all duration-200 hover:border-amber-500/40 hover:bg-card/80 hover:shadow-lg hover:shadow-amber-500/5">
        <CardContent className="flex flex-col gap-4 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div
              className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${section.gradient}`}
            >
              <Icon className="size-6 text-foreground" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* Title and badge */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{section.role}</h2>
              <Badge variant="secondary" className="text-xs">
                {totalCards} pages
              </Badge>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {section.roleDescription}
            </p>
          </div>

          {/* Group labels preview */}
          {groupLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {groupLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-md border border-border/40 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Feature list preview — first 4 */}
          <div className="mt-auto space-y-1.5 border-t border-border/30 pt-3">
            {section.groups
              .flatMap((g) => g.cards)
              .slice(0, 4)
              .map((card) => {
                const CIcon = card.icon;
                return (
                  <div
                    key={card.title + card.href}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <CIcon className="size-3 shrink-0 text-amber-500/70" />
                    <span>{card.title}</span>
                  </div>
                );
              })}
            {totalCards > 4 && (
              <p className="text-[11px] text-muted-foreground/60 pl-5">
                +{totalCards - 4} more pages
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function WalkthroughPage() {
  const totalFeatures = getTotalFeatureCount();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / gradient header */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-sky-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.15),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Platform Walkthrough
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Complete guide to every feature across all roles on AstrologyPro.
              Select a role below to explore its features in detail.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/70">
              {WALKTHROUGH_SECTIONS.length} portals &middot; {totalFeatures}{" "}
              feature pages
            </p>
          </div>

          {/* Platform highlights */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PLATFORM_HIGHLIGHTS.map((item) => {
              const HIcon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/30 bg-card/40 px-4 py-4 backdrop-blur-sm"
                >
                  <HIcon className="size-5 text-amber-500" />
                  <span className="text-xl font-bold tabular-nums">
                    {item.value}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role cards grid */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WALKTHROUGH_SECTIONS.map((section) => (
            <RoleCard key={section.slug} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-xl border border-border/30 bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This walkthrough covers {totalFeatures} feature pages across{" "}
            {WALKTHROUGH_SECTIONS.length} role portals. Each role page opens in
            a new tab with detailed feature cards. Some feature links require
            authentication or specific role access.
          </p>
        </div>
      </div>
    </div>
  );
}
