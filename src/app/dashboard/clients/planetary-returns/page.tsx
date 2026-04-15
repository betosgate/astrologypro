import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Orbit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planetary Returns" };

// ── Planet definitions ────────────────────────────────────────────────────────

const PLANETS = [
  { name: "Mars",              symbol: "♂", periodDays: 686.97,       color: "red"    as const },
  { name: "Jupiter",           symbol: "♃", periodDays: 4332.59,      color: "orange" as const },
  { name: "Saturn",            symbol: "♄", periodDays: 10759.22,     color: "amber"  as const },
  { name: "Uranus Opposition", symbol: "♅", periodDays: 30688.5 / 2,  color: "sky"    as const },
  { name: "Uranus",            symbol: "♅", periodDays: 30688.5,      color: "sky"    as const },
];

const ORDINALS = ["0th","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"];

function ordinal(n: number): string {
  if (n < ORDINALS.length) return ORDINALS[n];
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const BADGE: Record<string, string> = {
  red:    "bg-red-500/10 text-red-500 border-red-500/25",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/25",
  amber:  "bg-amber-500/10 text-amber-500 border-amber-500/25",
  sky:    "bg-sky-500/10 text-sky-500 border-sky-500/25",
};

const SYMBOL_COLOR: Record<string, string> = {
  red: "text-red-500", orange: "text-orange-500", amber: "text-amber-500", sky: "text-sky-500",
};

function planetColor(planet: string): "red" | "orange" | "amber" | "sky" {
  if (planet === "Saturn") return "amber";
  if (planet === "Jupiter") return "orange";
  if (planet === "Mars") return "red";
  return "sky";
}

interface ReturnEvent {
  clientId: string;
  clientName: string;
  planet: string;
  symbol: string;
  returnDate: Date;
  daysUntil: number;
  returnNumber: number;
  color: "red" | "orange" | "amber" | "sky";
}

function computeReturns(
  clients: Array<{ id: string; full_name: string; birth_date: string }>,
  windowDays: number
): ReturnEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const events: ReturnEvent[] = [];

  for (const client of clients) {
    const birthDate = new Date(client.birth_date + "T00:00:00");
    for (const planet of PLANETS) {
      const daysSinceBirth = (today.getTime() - birthDate.getTime()) / 86400000;
      if (daysSinceBirth < 0) continue;

      const cyclesAtStart = daysSinceBirth / planet.periodDays;
      const cyclesAtEnd = (daysSinceBirth + windowDays) / planet.periodDays;
      const nextCycleNumber = Math.ceil(cyclesAtStart);

      if (nextCycleNumber <= cyclesAtEnd) {
        const returnDayFromBirth = nextCycleNumber * planet.periodDays;
        const returnDate = new Date(birthDate.getTime() + returnDayFromBirth * 86400000);
        const daysUntil = Math.round((returnDate.getTime() - today.getTime()) / 86400000);
        if (daysUntil < 0 || daysUntil > windowDays) continue;

        events.push({
          clientId: client.id,
          clientName: client.full_name,
          planet: planet.name,
          symbol: planet.symbol,
          returnDate,
          daysUntil,
          returnNumber: nextCycleNumber,
          color: planetColor(planet.name),
        });
      }
    }
  }
  events.sort((a, b) => a.daysUntil - b.daysUntil);
  return events;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function eventLabel(evt: ReturnEvent) {
  return evt.planet === "Uranus Opposition"
    ? "Uranus Opposition"
    : `${ordinal(evt.returnNumber)} ${evt.planet} Return`;
}

// ── Urgency bucket helpers ────────────────────────────────────────────────────

function bucket(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil <= 7)  return "This Week";
  if (daysUntil <= 30) return "This Month";
  if (daysUntil <= 60) return "Next 60 Days";
  return "Next 90 Days";
}

const BUCKET_ORDER = ["Today", "This Week", "This Month", "Next 60 Days", "Next 90 Days"];

// ─────────────────────────────────────────────────────────────────────────────

export default async function PlanetaryReturnsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/dashboard");

  const { data: rows } = await admin
    .from("client_diviners")
    .select("clients!inner(id, full_name, birth_date)")
    .eq("diviner_id", diviner.id)
    .not("clients.birth_date", "is", null);

  const clients = (rows ?? [])
    .map((r: any) => r.clients)
    .filter((c: any) => c && typeof c.id === "string" && typeof c.birth_date === "string") as
    Array<{ id: string; full_name: string; birth_date: string }>;

  const all = computeReturns(clients, 90);

  // Group by bucket
  const grouped: Record<string, ReturnEvent[]> = {};
  for (const evt of all) {
    const b = bucket(evt.daysUntil);
    if (!grouped[b]) grouped[b] = [];
    grouped[b].push(evt);
  }

  const planetCounts: Record<string, number> = {};
  for (const evt of all) planetCounts[evt.planet] = (planetCounts[evt.planet] ?? 0) + 1;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Orbit className="size-5 text-sky-500" />
            <h1 className="text-2xl font-bold tracking-tight">Planetary Returns</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            All upcoming planetary returns for your clients — next 90 days.
          </p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0 mt-1">
          {all.length} event{all.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Planet summary pills */}
      {all.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(planetCounts).map(([planet, count]) => {
            const color = planetColor(planet);
            const sym = PLANETS.find(p => p.name === planet)?.symbol ?? "";
            return (
              <span key={planet} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${BADGE[color]}`}>
                <span>{sym}</span>
                {planet} <span className="opacity-70">×{count}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {all.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Orbit className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No planetary returns in the next 90 days.</p>
            <p className="text-xs text-muted-foreground mt-1">Returns are calculated for clients with a birth date on file.</p>
          </CardContent>
        </Card>
      )}

      {/* Grouped sections */}
      {BUCKET_ORDER.filter((b) => grouped[b]?.length > 0).map((b) => (
        <div key={b}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{b}</h2>
            <div className="flex-1 border-t border-border/50" />
            <span className="text-xs text-muted-foreground">{grouped[b].length}</span>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {grouped[b].map((evt, idx) => {
                  const label = eventLabel(evt);
                  return (
                    <div
                      key={`${evt.clientId}-${evt.planet}-${idx}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      {/* Left: symbol + client + return label */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 text-base w-5 text-center ${SYMBOL_COLOR[evt.color]}`}>
                          {evt.symbol}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/clients/${evt.clientId}`}
                            className="text-sm font-medium hover:underline hover:text-primary truncate block"
                          >
                            {evt.clientName}
                          </Link>
                          <Badge
                            variant="outline"
                            className={`text-[10px] mt-0.5 ${BADGE[evt.color]}`}
                          >
                            {label}
                          </Badge>
                        </div>
                      </div>

                      {/* Right: date + days pill */}
                      <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {fmtDate(evt.returnDate)}
                        </span>
                        {evt.daysUntil === 0 ? (
                          <span className="text-[10px] font-semibold text-amber-500">Today!</span>
                        ) : (
                          <span className={`text-[10px] font-semibold tabular-nums ${
                            evt.daysUntil <= 7 ? "text-amber-500" :
                            evt.daysUntil <= 30 ? "text-sky-500" : "text-muted-foreground"
                          }`}>
                            {evt.daysUntil}d
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
