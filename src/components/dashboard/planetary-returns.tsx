import Link from "next/link";
import { Orbit, ArrowUpRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlanetaryReturnsProps {
  divinerId: string;
}

interface ReturnEvent {
  clientId: string;
  clientName: string;
  planet: string;
  symbol: string;
  returnDate: Date;
  daysUntil: number;
  returnNumber: number;
}

const PLANETS = [
  {
    name: "Saturn",
    symbol: "♄",
    periodDays: 10759.22,
    color: "amber" as const,
  },
  {
    name: "Jupiter",
    symbol: "♃",
    periodDays: 4332.59,
    color: "orange" as const,
  },
  {
    name: "Mars",
    symbol: "♂",
    periodDays: 686.97,
    color: "red" as const,
  },
  {
    name: "Uranus",
    symbol: "♅",
    periodDays: 30688.5,
    color: "sky" as const,
  },
  {
    name: "Uranus Opposition",
    symbol: "♅",
    periodDays: 30688.5 / 2, // half cycle = ~42 years
    color: "sky" as const,
  },
];

const ORDINALS = [
  "0th", "1st", "2nd", "3rd", "4th", "5th",
  "6th", "7th", "8th", "9th", "10th",
];

function ordinal(n: number): string {
  if (n < ORDINALS.length) return ORDINALS[n];
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function badgeClasses(color: "amber" | "orange" | "red" | "sky"): string {
  switch (color) {
    case "amber":
      return "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20";
    case "orange":
      return "bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20";
    case "red":
      return "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20";
    case "sky":
      return "bg-sky-500/10 text-sky-600 border-sky-500/30 hover:bg-sky-500/20";
  }
}

function computeReturns(
  clients: Array<{ id: string; full_name: string; birth_date: string }>
): ReturnEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const window30Ms = 30 * 86400000;

  const events: ReturnEvent[] = [];

  for (const client of clients) {
    const birthDate = new Date(client.birth_date + "T00:00:00"); // parse as local date

    for (const planet of PLANETS) {
      const daysSinceBirth =
        (today.getTime() - birthDate.getTime()) / 86400000;

      if (daysSinceBirth < 0) continue; // future birth date, skip

      const cyclesAtStart = daysSinceBirth / planet.periodDays;
      const cyclesAtEnd = (daysSinceBirth + 30) / planet.periodDays;
      const nextCycleNumber = Math.ceil(cyclesAtStart);

      if (nextCycleNumber <= cyclesAtEnd) {
        const returnDayFromBirth = nextCycleNumber * planet.periodDays;
        const returnDate = new Date(
          birthDate.getTime() + returnDayFromBirth * 86400000
        );
        const daysUntil = Math.round(
          (returnDate.getTime() - today.getTime()) / 86400000
        );

        if (daysUntil < 0 || daysUntil > 30) continue;

        // For Uranus Opposition, return number is the number of half-cycles (always 1 for 42yr)
        const returnNumber = nextCycleNumber;

        events.push({
          clientId: client.id,
          clientName: client.full_name,
          planet: planet.name,
          symbol: planet.symbol,
          returnDate,
          daysUntil,
          returnNumber,
        });
      }
    }
  }

  events.sort((a, b) => a.daysUntil - b.daysUntil);
  return events;
}

function formatReturnDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function planetColor(
  planet: string
): "amber" | "orange" | "red" | "sky" {
  if (planet === "Saturn") return "amber";
  if (planet === "Jupiter") return "orange";
  if (planet === "Mars") return "red";
  return "sky"; // Uranus / Uranus Opposition
}

export async function PlanetaryReturns({ divinerId }: PlanetaryReturnsProps) {
  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("client_diviners")
    .select("clients!inner(id, full_name, birth_date)")
    .eq("diviner_id", divinerId)
    .not("clients.birth_date", "is", null);

  if (error) {
    // Fail silently — don't crash the dashboard for this widget
    return null;
  }

  const clients = (rows ?? [])
    .map((row: any) => row.clients)
    .filter(
      (c: any) =>
        c && typeof c.id === "string" && typeof c.birth_date === "string"
    ) as Array<{ id: string; full_name: string; birth_date: string }>;

  const returns = computeReturns(clients);

  return (
    <Card className="border-sky-500/20 shadow-[0_0_15px_-3px_rgba(14,165,233,0.08)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Orbit className="size-4 text-sky-500" />
          Planetary Returns — Next 30 Days
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {returns.length} event{returns.length !== 1 ? "s" : ""}
          </span>
          <Link
            href="/dashboard/clients/planetary-returns"
            className="flex items-center gap-0.5 text-[10px] text-sky-500 hover:text-sky-400 hover:underline"
          >
            View All
            <ArrowUpRight className="size-2.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {returns.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No planetary returns in the next 30 days.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {returns.map((evt, idx) => {
              const color = planetColor(evt.planet);
              const label =
                evt.planet === "Uranus Opposition"
                  ? "Uranus Opposition"
                  : `${ordinal(evt.returnNumber)} ${evt.planet} Return`;

              return (
                <div
                  key={`${evt.clientId}-${evt.planet}-${idx}`}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 text-sm w-5 text-center ${
                      color === "amber" ? "text-amber-500" :
                      color === "orange" ? "text-orange-500" :
                      color === "red" ? "text-red-500" : "text-sky-500"
                    }`}>
                      {evt.symbol}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/clients/${evt.clientId}`}
                        className="text-xs font-medium hover:underline hover:text-primary truncate block"
                      >
                        {evt.clientName}
                      </Link>
                      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {evt.daysUntil === 0 ? (
                      <span className="text-[10px] font-semibold text-amber-500">Today!</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatReturnDate(evt.returnDate)} · <span className="font-medium">{evt.daysUntil}d</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
