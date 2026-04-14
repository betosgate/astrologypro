import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Eye, Plus, ArrowLeft, Building2 } from "lucide-react";
import { WatchlistRemoveButton } from "./watchlist-remove-button";

export const dynamic = "force-dynamic";

const ENTITY_TYPE_BADGE: Record<string, string> = {
  country: "bg-blue-100 text-blue-700 border-blue-200",
  city: "bg-violet-100 text-violet-700 border-violet-200",
  institution: "bg-amber-100 text-amber-700 border-amber-200",
  market: "bg-green-100 text-green-700 border-green-200",
  commodity: "bg-orange-100 text-orange-700 border-orange-200",
  organization: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const DEFAULT_WATCHLIST_NAME = "My Watchlist";

const LIMIT = 20;

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  flag_emoji: string | null;
  region: string | null;
  is_active: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * LIMIT;

  const admin = createAdminClient();

  // Fetch user's watchlist
  const { data: watchlist } = await admin
    .from("mundane_watchlists")
    .select("id, entity_ids, updated_at")
    .eq("user_id", user.id)
    .eq("name", DEFAULT_WATCHLIST_NAME)
    .maybeSingle();

  const allEntityIds: string[] = watchlist?.entity_ids ?? [];
  const total = allEntityIds.length;
  const pagedIds = allEntityIds.slice(offset, offset + LIMIT);
  const hasPrev = page > 1;
  const hasMore = offset + LIMIT < total;

  // Fetch entity details for this page
  let entities: Entity[] = [];
  if (pagedIds.length > 0) {
    const { data } = await admin
      .from("mundane_entities")
      .select("id, name, entity_type, flag_emoji, region, is_active")
      .in("id", pagedIds);
    entities = (data ?? []) as Entity[];

    // Preserve watchlist order
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    entities = pagedIds
      .map((id) => entityMap.get(id))
      .filter((e): e is Entity => !!e);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="size-6 text-amber-500" />
            My Watchlist
          </h1>
          <p className="text-muted-foreground mt-1">
            Entities you are monitoring for astrological signals.
            {total > 0 && (
              <span className="ml-1 text-foreground font-medium">{total} entity{total === 1 ? "" : "ies"}</span>
            )}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/entities?action=watchlist">
            <Plus className="size-4 mr-1.5" />Add Entity
          </Link>
        </Button>
      </div>

      {entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Building2 className="size-10 text-muted-foreground/30" />
            <p className="font-medium">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add entities from the entity registry to watch for eclipse hits,
              ingresses, and astrological signals.
            </p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/entities?action=watchlist">
                <Plus className="size-4 mr-1.5" />Browse Entities
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Entity</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Region</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entities.map((entity) => (
                <tr key={entity.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entity.flag_emoji && (
                        <span className="text-lg leading-none">{entity.flag_emoji}</span>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/admin/mundane/entities/${entity.id}`}
                          className="font-medium hover:underline truncate block"
                        >
                          {entity.name}
                        </Link>
                        {!entity.is_active && (
                          <span className="text-xs text-muted-foreground">Inactive</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${ENTITY_TYPE_BADGE[entity.entity_type] ?? ""}`}
                    >
                      {entity.entity_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {entity.region ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <Link href={`/admin/mundane/entities/${entity.id}`} title="View entity">
                          <Eye className="size-3.5" />
                        </Link>
                      </Button>
                      <WatchlistRemoveButton entityId={entity.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          {hasPrev && (
            <Link href={`/admin/mundane/watchlist?page=${page - 1}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span>
            Page {page} of {Math.ceil(total / LIMIT)}
          </span>
          {hasMore && (
            <Link href={`/admin/mundane/watchlist?page=${page + 1}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}

      {watchlist?.updated_at && entities.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Last updated {formatDate(watchlist.updated_at)}
        </p>
      )}
    </div>
  );
}
