import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureCurrentMonthTransitsForMember } from "@/lib/community/ensure-monthly-transits";
import { isValidMonthlyTransit } from "@/lib/community/chart-validators";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Zap } from "lucide-react";
import Link from "next/link";
import { BookReadingButton } from "./BookReadingButton";

export const metadata = { title: "Monthly Transits - AstrologyPro Community" };
export const dynamic = "force-dynamic";

type TransitAspect = {
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
};

type TransitPlanet = {
  name: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  aspects: TransitAspect[];
};

type MonthlyTransitData = {
  month: string;
  planets: TransitPlanet[];
  highlights: string[];
};

type TransitRow = {
  id: string;
  month: string;
  transit_data: MonthlyTransitData;
  community_family_members: { full_name: string };
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅",
  Neptune: "♆", Pluto: "♇",
};

export default async function TransitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ── Lazy fallback (community-monthly-transit-architecture Task 05 T4) ───
  //
  // If this member has eligible family natal charts but no current-month
  // summary rows yet — typical for someone who subscribed mid-month, or
  // who just added a family member after the 1st-of-month cron ran — kick
  // off the shared catch-up service before we render. The service is
  // idempotent + skip-if-current, so this is safe even if cron also runs.
  //
  // We only call the service when the cheap pre-check shows it's needed,
  // to avoid an extra RPC on every page view. If the service errors we
  // log and continue — the page still renders the existing state and the
  // user can hit the URL again to retry.
  const { count: eligibleFamilyCount } = await supabase
    .from("community_family_members")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id)
    .eq("natal_status", "generated")
    .not("natal_chart", "is", null);

  const { count: existingTransitCount } = await supabase
    .from("monthly_transits")
    .select("id", { count: "exact", head: true })
    .eq("month", currentMonth);

  const needsCatchUp =
    (eligibleFamilyCount ?? 0) > 0 &&
    (existingTransitCount ?? 0) < (eligibleFamilyCount ?? 0);

  if (needsCatchUp) {
    try {
      await ensureCurrentMonthTransitsForMember(member.id);
    } catch (err) {
      console.warn(
        "[transits/page] lazy fallback failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Get this month's transits for all family members
  const { data: transits } = await supabase
    .from("monthly_transits")
    .select("id, month, transit_data, community_family_members!inner(full_name)")
    .eq("month", currentMonth)
    .order("id");

  // Filter out legacy/dummy rows whose transit_data doesn't pass the
  // current production-shape guard. Stale rows surface as "no current
  // summary" instead of broken UI — Task 03 + Task 06.
  const familyTransits = (
    (transits ?? []) as unknown as TransitRow[]
  ).filter((row) => isValidMonthlyTransit(row.transit_data, currentMonth));

  // Check if family members exist but have no transits yet
  const { count: familyCount } = await supabase
    .from("community_family_members")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id)
    .not("natal_chart", "is", null);

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight">Monthly Transits</h1>
            </div>
            <p className="text-muted-foreground">
              How the current sky affects your family — {monthLabel}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/community/transits/detailed">Open Full Monthly Report</Link>
          </Button>
        </div>
      </div>

      {/* Community member cross-sell CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Get a professional reading</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              As a community member you receive a 5% discount on platform fees when you book an AstrologyPro reading.
            </p>
          </div>
          <BookReadingButton />
        </CardContent>
      </Card>

      {(familyCount ?? 0) === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No charts generated yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate natal charts for your family members first, then transits will appear here monthly.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/family">Go to Family</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {(familyCount ?? 0) > 0 && familyTransits.length === 0 && (
        <Card className="border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Transits generating soon
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-1">
              Monthly transits are generated on the 1st of each month. Check back then, or ask an admin to trigger a manual run.
            </p>
          </CardContent>
        </Card>
      )}

      {familyTransits.map((row) => {
        const data = row.transit_data;
        const harmoniousCount = data.planets.reduce(
          (s, p) => s + p.aspects.filter((a) => a.isHarmonious).length,
          0
        );
        const challengingCount = data.planets.reduce(
          (s, p) => s + p.aspects.filter((a) => !a.isHarmonious).length,
          0
        );

        return (
          <Card key={row.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-base">
                    {row.community_family_members.full_name}
                  </CardTitle>
                  <CardDescription>
                    {harmoniousCount} supportive · {challengingCount} challenging aspects
                  </CardDescription>
                </div>
                <Link
                  href="/diviner"
                  className="text-xs text-primary hover:underline"
                >
                  Book a reading →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Highlights */}
              {data.highlights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Star className="size-3" />
                    Key Transits
                  </p>
                  <div className="space-y-1.5">
                    {data.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Zap className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planet positions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Planets
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {data.planets.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <span className="text-lg leading-none">
                        {PLANET_GLYPHS[p.name] ?? "●"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {p.name}
                          {p.retrograde && (
                            <span className="ml-1 text-xs text-muted-foreground">℞</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.sign} {p.degree.toFixed(1)}°
                          {p.aspects.length > 0 && (
                            <> · {p.aspects.length} aspect{p.aspects.length !== 1 ? "s" : ""}</>
                          )}
                        </p>
                      </div>
                      {p.aspects.some((a) => !a.isHarmonious) && (
                        <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
                          ⚡
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
