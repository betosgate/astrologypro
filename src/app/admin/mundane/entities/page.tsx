import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Globe, Plus, ArrowLeft, MapPin, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

const ENTITY_TYPE_BADGE: Record<string, string> = {
  country:      "bg-blue-100 text-blue-700 border-blue-200",
  city:         "bg-teal-100 text-teal-700 border-teal-200",
  institution:  "bg-purple-100 text-purple-700 border-purple-200",
  market:       "bg-amber-100 text-amber-700 border-amber-200",
  commodity:    "bg-orange-100 text-orange-700 border-orange-200",
  organization: "bg-emerald-100 text-emerald-700 border-emerald-200",
  other:        "bg-gray-100 text-gray-600 border-gray-200",
};

type MundaneEntity = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  flag_emoji: string | null;
  birth_date: string | null;
  birth_location: string | null;
  birth_data_confidence: string | null;
  is_active: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminMundaneEntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity_type?: string; active?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const entityType = sp.entity_type ?? "";
  const activeFilter = sp.active ?? "true";
  const limit = 25;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_entities")
    .select(
      "id, name, entity_type, region, flag_emoji, birth_date, birth_location, birth_data_confidence, is_active",
      { count: "exact" }
    );

  if (activeFilter === "true") query = query.eq("is_active", true);
  else if (activeFilter === "false") query = query.eq("is_active", false);

  if (entityType) query = query.eq("entity_type", entityType);

  const { data, error, count } = await query
    .order("entity_type", { ascending: true })
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return (
      <div className="text-destructive text-sm p-4">
        Failed to load entities: {error.message}
      </div>
    );
  }

  const entities = (data ?? []) as MundaneEntity[];
  const total = count ?? 0;
  const hasMore = offset + limit < total;
  const hasPrev = page > 1;

  const typeFilters = [
    { label: "All", value: "" },
    { label: "🌍 Country", value: "country" },
    { label: "🏙 City", value: "city" },
    { label: "🏛 Institution", value: "institution" },
    { label: "📈 Market", value: "market" },
    { label: "🪙 Commodity", value: "commodity" },
    { label: "🏢 Organization", value: "organization" },
  ];

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      page: "1",
      active: activeFilter,
      entity_type: entityType,
      ...overrides,
    });
    return `/admin/mundane/entities?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="size-6 text-blue-500" />
            Entity Registry
          </h1>
          <p className="text-muted-foreground text-sm">
            Countries, cities, institutions, markets, and organisations tracked in mundane astrology.{" "}
            <span className="text-foreground font-medium">{total} total</span>
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/entities/new">
            <Plus className="mr-1.5 size-4" /> New Entity
          </Link>
        </Button>
      </div>

      {/* Active / type filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 border rounded-md p-1">
          {[
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
            { label: "All", value: "" },
          ].map((opt) => (
            <Link key={opt.value} href={buildHref({ active: opt.value })}>
              <Badge
                variant={activeFilter === opt.value ? "default" : "outline"}
                className="cursor-pointer text-xs"
              >
                {opt.label}
              </Badge>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {typeFilters.map((opt) => (
            <Link key={opt.value} href={buildHref({ entity_type: opt.value })}>
              <Badge
                variant={entityType === opt.value ? "default" : "outline"}
                className="cursor-pointer text-xs"
              >
                {opt.label}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Globe className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No entities found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or add the first entity.
            </p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/entities/new">
                <Plus className="mr-1.5 size-4" /> Add Entity
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entities.map((entity) => (
            <Link
              key={entity.id}
              href={`/admin/mundane/entities/${entity.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {entity.flag_emoji ? (
                  <span className="text-2xl shrink-0">{entity.flag_emoji}</span>
                ) : (
                  <Globe className="size-5 shrink-0 text-muted-foreground/50" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entity.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {entity.region && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3" />
                        {entity.region}
                      </span>
                    )}
                    {entity.birth_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        Founded {formatDate(entity.birth_date)}
                        {entity.birth_location ? `, ${entity.birth_location}` : ""}
                      </span>
                    )}
                    {entity.birth_data_confidence && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        {entity.birth_data_confidence}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`capitalize text-xs ${ENTITY_TYPE_BADGE[entity.entity_type] ?? ENTITY_TYPE_BADGE.other}`}
                >
                  {entity.entity_type}
                </Badge>
                {!entity.is_active && (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            {hasPrev && (
              <Button size="sm" variant="outline" asChild>
                <Link href={buildHref({ page: String(page - 1) })}>← Previous</Link>
              </Button>
            )}
            {hasMore && (
              <Button size="sm" variant="outline" asChild>
                <Link href={buildHref({ page: String(page + 1) })}>Next →</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
