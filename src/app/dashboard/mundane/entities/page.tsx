import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entities — Mundane" };

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  region: string | null;
  flag_emoji: string | null;
};

export default async function DashboardMundaneEntitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [entitiesRes, watchlistRes] = await Promise.all([
    admin
      .from("mundane_entities")
      .select("id, name, entity_type, region, flag_emoji")
      .eq("is_active", true)
      .order("name"),
    admin.from("mundane_watchlists").select("entity_ids").eq("user_id", user.id),
  ]);

  // De-dup by name, prefer seed IDs (e1000000*)
  const entByName = new Map<string, Entity>();
  for (const e of (entitiesRes.data ?? []) as Entity[]) {
    const existing = entByName.get(e.name);
    if (!existing || e.id.startsWith("e1000000")) entByName.set(e.name, e);
  }
  const entities = Array.from(entByName.values());

  const watched = new Set<string>(
    (watchlistRes.data ?? []).flatMap((w: { entity_ids: string[] | null }) => w.entity_ids ?? [])
  );

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="size-6 text-violet-500" />
          Entities
        </h1>
        <p className="text-muted-foreground">
          Countries, institutions, and leaders tracked in mundane astrology.
          {watched.size > 0 && <> You&apos;re watching <strong>{watched.size}</strong>.</>}
        </p>
      </div>

      {entities.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No entities available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((e) => (
            <Link
              key={e.id}
              href={`/community/mundane/${e.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/30 transition-colors"
            >
              <span className="text-2xl shrink-0">{e.flag_emoji ?? "🌐"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {e.entity_type}
                  {e.region ? ` · ${e.region}` : ""}
                </p>
              </div>
              {watched.has(e.id) && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-violet-50 text-violet-700 border-violet-200"
                >
                  <Eye className="size-3 mr-1" /> Watching
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
