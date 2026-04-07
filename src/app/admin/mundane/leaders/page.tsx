import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { UserRound, Plus, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Leader = {
  id: string;
  full_name: string;
  office_title: string | null;
  country_entity_id: string | null;
  is_current: boolean;
  birth_date: string | null;
  birth_location: string | null;
  birth_data_confidence: string | null;
};

export default async function AdminMundaneLeadersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; is_current?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const isCurrent = sp.is_current ?? "true";
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_leaders")
    .select("id, full_name, office_title, country_entity_id, is_current, birth_date, birth_location, birth_data_confidence", { count: "exact" });

  if (isCurrent === "true") query = query.eq("is_current", true);
  else if (isCurrent === "false") query = query.eq("is_current", false);

  const { data, error, count } = await query
    .order("full_name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return (
      <div className="text-destructive text-sm">Failed to load leaders: {error.message}</div>
    );
  }

  const leaders = (data ?? []) as Leader[];
  const total = count ?? 0;
  const hasMore = offset + limit < total;
  const hasPrev = page > 1;

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
            <UserRound className="size-6 text-violet-500" />
            Leader Registry
          </h1>
          <p className="text-muted-foreground">World leaders and notable persons tracked in mundane astrology.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/leaders/new">
            <Plus className="mr-1.5 size-4" /> New Leader
          </Link>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {[
          { label: "Current", value: "true" },
          { label: "Former", value: "false" },
          { label: "All", value: "" },
        ].map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/mundane/leaders?is_current=${opt.value}`}
          >
            <Badge
              variant={isCurrent === opt.value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {opt.label}
            </Badge>
          </Link>
        ))}
      </div>

      {leaders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <UserRound className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No leaders found</p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/leaders/new">
                <Plus className="mr-1.5 size-4" /> Add Leader
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{leader.full_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {leader.office_title && (
                    <span className="text-xs text-muted-foreground">{leader.office_title}</span>
                  )}
                  {leader.birth_location && (
                    <span className="text-xs text-muted-foreground">born: {leader.birth_location}</span>
                  )}
                  {leader.birth_data_confidence && (
                    <Badge variant="outline" className="text-xs">{leader.birth_data_confidence}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs ${leader.is_current ? "text-green-700 border-green-200 bg-green-50" : "text-muted-foreground"}`}
                >
                  {leader.is_current ? "Current" : "Former"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          {hasPrev && (
            <Link href={`/admin/mundane/leaders?page=${page - 1}&is_current=${isCurrent}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          {hasMore && (
            <Link href={`/admin/mundane/leaders?page=${page + 1}&is_current=${isCurrent}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
