import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AttributionKind = "organic" | "affiliate" | "advocate" | "unknown";

type TopDiviner = {
  divinerId: string;
  divinerName: string;
  username: string;
  hits: number;
  uniqueVisitors: number;
  affiliateHits: number;
  advocateHits: number;
  nonPartnerHits: number;
  topCountry: string;
  topLocation: string;
  topSource: string;
  lastHitAt: string | null;
};

type BreakdownRow = {
  label: string;
  hits: number;
};

type HourlyRow = {
  hour: string;
  hits: number;
  affiliateHits: number;
  advocateHits: number;
};

export interface DivinerTrafficReportResponse {
  summary: {
    totalHits: number;
    uniqueVisitors: number;
    affiliateHits: number;
    advocateHits: number;
    organicHits: number;
  };
  topDiviners: TopDiviner[];
  countries: BreakdownRow[];
  locations: BreakdownRow[];
  sources: BreakdownRow[];
  hourly: HourlyRow[];
}

function periodToDate(period: string): string | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
    default:
      return null;
  }
}

function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const dateAfter = periodToDate(period);
  const admin = createAdminClient();

  let query = admin
    .from("page_views")
    .select(
      "diviner_id, ip_hash, country_code, country_region, city, traffic_source, attribution_kind, affiliate_related, advocate_related, created_at"
    )
    .order("created_at", { ascending: false });

  if (dateAfter) {
    query = query.gte("created_at", dateAfter);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const divinerIds = Array.from(
    new Set(rows.map((row) => row.diviner_id).filter(Boolean))
  ) as string[];

  const divinerMap = new Map<string, { display_name: string; username: string }>();
  if (divinerIds.length > 0) {
    const { data: diviners } = await admin
      .from("diviners")
      .select("id, display_name, username")
      .in("id", divinerIds);

    for (const diviner of diviners ?? []) {
      divinerMap.set(diviner.id, {
        display_name: diviner.display_name ?? "Unknown",
        username: diviner.username ?? "",
      });
    }
  }

  const uniqueVisitors = new Set<string>();
  const countryCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const hourlyCounts = new Map<number, { hits: number; affiliateHits: number; advocateHits: number }>();
  const byDiviner = new Map<
    string,
    {
      hits: number;
      uniqueVisitors: Set<string>;
      affiliateHits: number;
      advocateHits: number;
      nonPartnerHits: number;
      countryCounts: Map<string, number>;
      locationCounts: Map<string, number>;
      sourceCounts: Map<string, number>;
      lastHitAt: string | null;
    }
  >();

  let affiliateHits = 0;
  let advocateHits = 0;
  let organicHits = 0;

  for (const row of rows) {
    const divinerId = row.diviner_id as string | null;
    const ipHash = row.ip_hash as string | null;
    const country = (row.country_code as string | null) ?? "Unknown";
    const location = [row.city, row.country_region, row.country_code]
      .filter(Boolean)
      .join(", ") || "Unknown";
    const source = toTitleCase((row.traffic_source as string | null) ?? "direct");
    const createdAt = row.created_at as string | null;
    const attributionKind = ((row.attribution_kind as string | null) ?? "organic") as AttributionKind;
    const isAffiliate = row.affiliate_related === true || attributionKind === "affiliate";
    const isAdvocate = row.advocate_related === true || attributionKind === "advocate";

    if (ipHash) uniqueVisitors.add(ipHash);
    bump(countryCounts, country);
    bump(locationCounts, location);
    bump(sourceCounts, source);

    if (isAffiliate) affiliateHits++;
    else if (isAdvocate) advocateHits++;
    else organicHits++;

    if (createdAt) {
      const hour = new Date(createdAt).getHours();
      const bucket = hourlyCounts.get(hour) ?? { hits: 0, affiliateHits: 0, advocateHits: 0 };
      bucket.hits++;
      if (isAffiliate) bucket.affiliateHits++;
      if (isAdvocate) bucket.advocateHits++;
      hourlyCounts.set(hour, bucket);
    }

    if (!divinerId) continue;
    const entry =
      byDiviner.get(divinerId) ??
      {
        hits: 0,
        uniqueVisitors: new Set<string>(),
        affiliateHits: 0,
        advocateHits: 0,
        nonPartnerHits: 0,
        countryCounts: new Map<string, number>(),
        locationCounts: new Map<string, number>(),
        sourceCounts: new Map<string, number>(),
        lastHitAt: null,
      };

    entry.hits++;
    if (ipHash) entry.uniqueVisitors.add(ipHash);
    if (isAffiliate) entry.affiliateHits++;
    else if (isAdvocate) entry.advocateHits++;
    else entry.nonPartnerHits++;
    bump(entry.countryCounts, country);
    bump(entry.locationCounts, location);
    bump(entry.sourceCounts, source);
    if (!entry.lastHitAt || (createdAt && createdAt > entry.lastHitAt)) {
      entry.lastHitAt = createdAt;
    }
    byDiviner.set(divinerId, entry);
  }

  const toTopLabel = (map: Map<string, number>): string => {
    const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
    return top?.[0] ?? "Unknown";
  };

  const topDiviners: TopDiviner[] = Array.from(byDiviner.entries())
    .map(([divinerId, stats]) => {
      const diviner = divinerMap.get(divinerId);
      return {
        divinerId,
        divinerName: diviner?.display_name ?? "Unknown",
        username: diviner?.username ?? "",
        hits: stats.hits,
        uniqueVisitors: stats.uniqueVisitors.size,
        affiliateHits: stats.affiliateHits,
        advocateHits: stats.advocateHits,
        nonPartnerHits: stats.nonPartnerHits,
        topCountry: toTopLabel(stats.countryCounts),
        topLocation: toTopLabel(stats.locationCounts),
        topSource: toTopLabel(stats.sourceCounts),
        lastHitAt: stats.lastHitAt,
      };
    })
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 25);

  const packBreakdown = (map: Map<string, number>): BreakdownRow[] =>
    Array.from(map.entries())
      .map(([label, hits]) => ({ label, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 12);

  const hourly: HourlyRow[] = Array.from({ length: 24 }, (_, hour) => {
    const bucket = hourlyCounts.get(hour) ?? { hits: 0, affiliateHits: 0, advocateHits: 0 };
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      hits: bucket.hits,
      affiliateHits: bucket.affiliateHits,
      advocateHits: bucket.advocateHits,
    };
  });

  const response: DivinerTrafficReportResponse = {
    summary: {
      totalHits: rows.length,
      uniqueVisitors: uniqueVisitors.size,
      affiliateHits,
      advocateHits,
      organicHits,
    },
    topDiviners,
    countries: packBreakdown(countryCounts),
    locations: packBreakdown(locationCounts),
    sources: packBreakdown(sourceCounts),
    hourly,
  };

  return NextResponse.json(response);
}
