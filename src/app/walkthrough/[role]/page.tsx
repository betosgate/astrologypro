import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  getSectionBySlug,
  ROLE_SLUGS,
  type FeatureCard,
} from "@/lib/walkthrough-data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// ─── Dynamic metadata ─────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ role: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { role } = await params;
  const section = getSectionBySlug(role);
  if (!section) {
    return { title: "Not Found — AstrologyPro" };
  }

  return {
    title: `${section.role} — Platform Walkthrough — AstrologyPro`,
    description: section.roleDescription,
    openGraph: {
      title: `${section.role} — Platform Walkthrough`,
      description: section.roleDescription,
    },
  };
}

// ─── Static params for known slugs ────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(ROLE_SLUGS).map((slug) => ({ role: slug }));
}

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: FeatureCard["status"] }) {
  if (!status) return null;

  const config = {
    live: {
      label: "Live",
      className:
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    beta: {
      label: "Beta",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    "coming-soon": {
      label: "Soon",
      className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ─── Feature card ──────────────────────────────────────────────────────────

function FeatureCardComponent({ card }: { card: FeatureCard }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className="group block">
      <Card className="h-full border-border/40 bg-card/60 transition-all duration-200 hover:border-amber-500/40 hover:bg-card/80 hover:shadow-lg hover:shadow-amber-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500/20">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {card.title}
              </span>
              <StatusBadge status={card.status} />
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {card.description}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-mono text-muted-foreground/60">
              <ExternalLink className="size-2.5" />
              {card.href}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function RoleWalkthroughPage({ params }: PageProps) {
  const { role } = await params;
  const section = getSectionBySlug(role);

  if (!section) {
    notFound();
  }

  const Icon = section.icon;
  const totalCards = section.groups.reduce(
    (sum, g) => sum + g.cards.length,
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${section.gradient}`}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          {/* Back link */}
          <Link
            href="/walkthrough"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Walkthrough
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm">
              <Icon className="size-7 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {section.role}
                </h1>
                <Badge variant="secondary" className="text-sm">
                  {totalCards} pages
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {section.roleDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature groups */}
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-8">
        {section.groups.map((group, gi) => (
          <div key={gi} className="space-y-4">
            {group.groupLabel && (
              <h2 className="ml-1 border-l-2 border-amber-500/40 pl-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.groupLabel}
              </h2>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.cards.map((card) => (
                <FeatureCardComponent
                  key={card.href + card.title}
                  card={card}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="rounded-xl border border-border/30 bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {section.role} has {totalCards} feature pages. Some pages may
            require authentication or specific role access.
          </p>
          <Link
            href="/walkthrough"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            View all roles
          </Link>
        </div>
      </div>
    </div>
  );
}
