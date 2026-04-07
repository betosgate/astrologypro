import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

type DivinerSubType = "astrologer" | "tarot" | "oracle";
type SortOption = "certified" | "rating" | "sessions" | "price";

interface DivinerRow {
  username: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  isCertified: boolean;
  specialties: string[];
  subType: DivinerSubType;
  startingPrice: number | null;
  reviewCount: number;
  averageRating: number | null;
  completedSessions: number;
}

/**
 * GET /api/public/diviners
 *
 * Query params:
 *   type    = astrologer | tarot | oracle | all   (default: all)
 *   sort    = certified | rating | sessions | price  (default: certified)
 *   search  = string — searches display_name, tagline, bio, specialties
 *   cursor  = last username from previous page (keyset pagination)
 *   limit   = number of results (default: 18, max: 48)
 *
 * Returns:
 *   { data: DivinerRow[], nextCursor: string | null, total: number }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = (searchParams.get("type") ?? "all") as DivinerSubType | "all";
  const sort = (searchParams.get("sort") ?? "certified") as SortOption;
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const cursor = searchParams.get("cursor") ?? null;
  const limitRaw = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") ?? "18", 10) || 18),
    48
  );

  // Validate type
  const validTypes = ["all", "astrologer", "tarot", "oracle"] as const;
  if (!validTypes.includes(type as (typeof validTypes)[number])) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/invalid-param", title: "Invalid type parameter", status: 422 },
      { status: 422 }
    );
  }

  // Validate sort
  const validSorts = ["certified", "rating", "sessions", "price"] as const;
  if (!validSorts.includes(sort as (typeof validSorts)[number])) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/invalid-param", title: "Invalid sort parameter", status: 422 },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch active, onboarding-complete diviners
  const { data: diviners, error } = await admin
    .from("diviners")
    .select(
      "id, username, display_name, tagline, bio, avatar_url, cover_image_url, specialties, is_certified"
    )
    .eq("is_active", true)
    .eq("onboarding_completed", true)
    .eq("account_status", "active")
    .eq("charges_enabled", true);

  if (error) {
    console.error("[/api/public/diviners] DB error", error);
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal server error", status: 500 },
      { status: 500 }
    );
  }

  if (!diviners || diviners.length === 0) {
    return NextResponse.json(
      { data: [], nextCursor: null, total: 0 },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  }

  const divinerIds = diviners.map((d) => d.id as string);

  // Batch fetch supporting data
  const [servicesResult, testimonialsResult, bookingsResult] = await Promise.all([
    admin
      .from("services")
      .select("diviner_id, category, base_price")
      .in("diviner_id", divinerIds)
      .eq("is_active", true),
    admin
      .from("testimonials")
      .select("diviner_id, rating")
      .in("diviner_id", divinerIds)
      .eq("status", "approved"),
    admin
      .from("bookings")
      .select("diviner_id")
      .in("diviner_id", divinerIds)
      .eq("status", "completed"),
  ]);

  // Build lookup maps
  const servicesByDiviner = new Map<string, { category: string; base_price: number }[]>();
  for (const svc of servicesResult.data ?? []) {
    const id = svc.diviner_id as string;
    if (!servicesByDiviner.has(id)) servicesByDiviner.set(id, []);
    servicesByDiviner.get(id)!.push({
      category: svc.category as string,
      base_price: Number(svc.base_price),
    });
  }

  const testimonialsByDiviner = new Map<string, number[]>();
  for (const t of testimonialsResult.data ?? []) {
    const id = t.diviner_id as string;
    if (!testimonialsByDiviner.has(id)) testimonialsByDiviner.set(id, []);
    if (t.rating != null) testimonialsByDiviner.get(id)!.push(t.rating as number);
  }

  const sessionCountByDiviner = new Map<string, number>();
  for (const b of bookingsResult.data ?? []) {
    const id = b.diviner_id as string;
    sessionCountByDiviner.set(id, (sessionCountByDiviner.get(id) ?? 0) + 1);
  }

  // Build enriched rows
  let rows: DivinerRow[] = diviners.map((diviner) => {
    const id = diviner.id as string;
    const services = servicesByDiviner.get(id) ?? [];
    const ratings = testimonialsByDiviner.get(id) ?? [];
    const completedSessions = sessionCountByDiviner.get(id) ?? 0;

    const hasAstrology = services.some((s) => s.category === "astrology");
    const hasTarot = services.some((s) => s.category === "tarot");
    let subType: DivinerSubType = "astrologer";
    if (hasAstrology && hasTarot) subType = "oracle";
    else if (hasTarot) subType = "tarot";

    const startingPrice =
      services.length > 0
        ? Math.min(...services.map((s) => s.base_price))
        : null;

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : null;

    return {
      username: diviner.username as string,
      displayName: diviner.display_name as string,
      tagline: (diviner.tagline as string | null) ?? null,
      bio: (diviner.bio as string | null) ?? null,
      avatarUrl: (diviner.avatar_url as string | null) ?? null,
      coverImageUrl: (diviner.cover_image_url as string | null) ?? null,
      isCertified: !!(diviner.is_certified as boolean | null),
      specialties: (diviner.specialties as string[]) ?? [],
      subType,
      startingPrice,
      reviewCount: ratings.length,
      averageRating,
      completedSessions,
    };
  });

  // Filter by type
  if (type !== "all") {
    rows = rows.filter((r) => r.subType === type);
  }

  // Filter by search
  if (search) {
    rows = rows.filter(
      (r) =>
        r.displayName.toLowerCase().includes(search) ||
        (r.tagline?.toLowerCase().includes(search) ?? false) ||
        (r.bio?.toLowerCase().includes(search) ?? false) ||
        r.specialties.some((s) => s.toLowerCase().includes(search))
    );
  }

  const total = rows.length;

  // Sort
  switch (sort) {
    case "certified":
      rows.sort((a, b) => {
        if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return b.completedSessions - a.completedSessions;
      });
      break;
    case "rating":
      rows.sort((a, b) => {
        const diff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
        if (Math.abs(diff) > 0.001) return diff;
        if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
        return b.reviewCount - a.reviewCount;
      });
      break;
    case "sessions":
      rows.sort((a, b) => {
        if (b.completedSessions !== a.completedSessions)
          return b.completedSessions - a.completedSessions;
        if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
        return 0;
      });
      break;
    case "price":
      rows.sort(
        (a, b) => (a.startingPrice ?? 9999) - (b.startingPrice ?? 9999)
      );
      break;
  }

  // Cursor-based pagination (keyset on username after sort)
  let startIndex = 0;
  if (cursor) {
    const idx = rows.findIndex((r) => r.username === cursor);
    if (idx !== -1) startIndex = idx + 1;
  }

  const page = rows.slice(startIndex, startIndex + limitRaw);
  const nextCursor =
    startIndex + limitRaw < rows.length
      ? page[page.length - 1]?.username ?? null
      : null;

  return NextResponse.json(
    { data: page, nextCursor, total },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
