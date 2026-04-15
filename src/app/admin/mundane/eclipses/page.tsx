import Link from "next/link";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Eclipse = {
  id: string;
  date_utc: string;
  type: "solar" | "lunar";
  subtype: string | null;
  saros_series: number | null;
  saros_member: number | null;
  degree_ecliptic: number | null;
  sign: string | null;
  magnitude: number | null;
  is_visible_globally: boolean;
  notes: string | null;
};

const SUBTYPE_BADGE: Record<string, string> = {
  total: "bg-amber-100 text-amber-700 border-amber-200",
  annular: "bg-orange-100 text-orange-700 border-orange-200",
  partial: "bg-sky-100 text-sky-700 border-sky-200",
  penumbral: "bg-slate-100 text-slate-600 border-slate-200",
  hybrid: "bg-violet-100 text-violet-700 border-violet-200",
};

const SIGN_SYMBOL: Record<string, string> = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
  leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
  sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDegree(deg: number | null, sign: string | null): string {
  if (deg == null) return "—";
  // Convert 0-360 to sign degree (0-30)
  const signDeg = deg % 30;
  const symbol = sign ? (SIGN_SYMBOL[sign] ?? sign) : "";
  return `${signDeg.toFixed(1)}° ${symbol} ${sign ? sign.charAt(0).toUpperCase() + sign.slice(1) : ""}`;
}

function EclipseCard({ eclipse }: { eclipse: Eclipse }) {
  const isSolar = eclipse.type === "solar";
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${isSolar ? "bg-amber-100" : "bg-indigo-100"}`}>
        {isSolar
          ? <Sun className="size-4 text-amber-600" />
          : <Moon className="size-4 text-indigo-600" />
        }
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{formatDate(eclipse.date_utc)}</span>
          {eclipse.subtype && (
            <Badge
              variant="outline"
              className={`text-xs capitalize ${SUBTYPE_BADGE[eclipse.subtype] ?? ""}`}
            >
              {eclipse.subtype}
            </Badge>
          )}
          {!eclipse.is_visible_globally && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Regional
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>{formatDegree(eclipse.degree_ecliptic, eclipse.sign)}</span>
          {eclipse.saros_series != null && (
            <span>Saros {eclipse.saros_series}{eclipse.saros_member != null ? ` / #{eclipse.saros_member}` : ""}</span>
          )}
          {eclipse.magnitude != null && (
            <span>Mag: {eclipse.magnitude.toFixed(4)}</span>
          )}
        </div>
        {eclipse.notes && (
          <p className="text-xs text-muted-foreground leading-relaxed">{eclipse.notes}</p>
        )}
      </div>
    </div>
  );
}

export default async function AdminMundaneEclipsesPage() {
  const admin_user = await requireAdmin();
  if (!admin_user) redirect("/admin/login");

  const now = new Date();
  const past12Start = new Date(now);
  past12Start.setMonth(past12Start.getMonth() - 12);
  const future24End = new Date(now);
  future24End.setMonth(future24End.getMonth() + 24);

  const db = createAdminClient();

  const [upcomingRes, pastRes] = await Promise.all([
    db
      .from("mundane_eclipses")
      .select("id, date_utc, type, subtype, saros_series, saros_member, degree_ecliptic, sign, magnitude, is_visible_globally, notes")
      .gte("date_utc", now.toISOString())
      .lte("date_utc", future24End.toISOString())
      .order("date_utc", { ascending: true })
      .limit(50),
    db
      .from("mundane_eclipses")
      .select("id, date_utc, type, subtype, saros_series, saros_member, degree_ecliptic, sign, magnitude, is_visible_globally, notes")
      .gte("date_utc", past12Start.toISOString())
      .lt("date_utc", now.toISOString())
      .order("date_utc", { ascending: false })
      .limit(50),
  ]);

  const upcoming = (upcomingRes.data ?? []) as Eclipse[];
  const past = (pastRes.data ?? []) as Eclipse[];

  const upcomingSolar = upcoming.filter((e) => e.type === "solar");
  const upcomingLunar = upcoming.filter((e) => e.type === "lunar");
  const pastSolar = past.filter((e) => e.type === "solar");
  const pastLunar = past.filter((e) => e.type === "lunar");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/mundane"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-4" /> Back to Mundane
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-xl">☀🌑</span> Eclipse Catalog
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Solar and lunar eclipses 2024–2028 with Saros series and zodiac positions.
        </p>
      </div>

      {/* ── Upcoming tab section ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          Upcoming Eclipses
          <Badge variant="outline" className="text-xs">{upcoming.length} in next 24 months</Badge>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Upcoming Solar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-700">
              <Sun className="size-4" /> Solar Eclipses
              <span className="text-muted-foreground font-normal">({upcomingSolar.length})</span>
            </h3>
            {upcomingSolar.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming solar eclipses in the next 24 months.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcomingSolar.map((e) => (
                  <EclipseCard key={e.id} eclipse={e} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Lunar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-700">
              <Moon className="size-4" /> Lunar Eclipses
              <span className="text-muted-foreground font-normal">({upcomingLunar.length})</span>
            </h3>
            {upcomingLunar.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming lunar eclipses in the next 24 months.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcomingLunar.map((e) => (
                  <EclipseCard key={e.id} eclipse={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Past (last 12 months) ─────────────────────────────────────────── */}
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            Past 12 Months
            <Badge variant="outline" className="text-xs text-muted-foreground">{past.length} eclipses</Badge>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                <Sun className="size-4" /> Solar
              </h3>
              {pastSolar.length === 0 ? (
                <p className="text-sm text-muted-foreground">None in last 12 months.</p>
              ) : (
                <div className="space-y-2">
                  {pastSolar.map((e) => (
                    <EclipseCard key={e.id} eclipse={e} />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-700">
                <Moon className="size-4" /> Lunar
              </h3>
              {pastLunar.length === 0 ? (
                <p className="text-sm text-muted-foreground">None in last 12 months.</p>
              ) : (
                <div className="space-y-2">
                  {pastLunar.map((e) => (
                    <EclipseCard key={e.id} eclipse={e} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
