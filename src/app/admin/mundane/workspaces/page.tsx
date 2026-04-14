import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const TRADITION_BADGE: Record<string, string> = {
  western: "bg-blue-100 text-blue-700 border-blue-200",
  vedic: "bg-orange-100 text-orange-700 border-orange-200",
  hybrid: "bg-violet-100 text-violet-700 border-violet-200",
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  astrologer: "bg-violet-100 text-violet-700 border-violet-200",
  researcher: "bg-blue-100 text-blue-700 border-blue-200",
  editor: "bg-teal-100 text-teal-700 border-teal-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function getWorkspaces(userId: string) {
  const admin = createAdminClient();

  // Owned workspaces
  const { data: owned } = await admin
    .from("mundane_workspaces")
    .select("id, name, description, tradition, is_active, created_at, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  // Member rows (workspace_id + role)
  const { data: memberRows } = await admin
    .from("mundane_workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId);

  const ownedIds = new Set((owned ?? []).map((w) => w.id));
  const memberOnlyIds = (memberRows ?? [])
    .map((r) => r.workspace_id)
    .filter((wid) => !ownedIds.has(wid));

  let memberWorkspaces: typeof owned = [];
  if (memberOnlyIds.length > 0) {
    const { data: mw } = await admin
      .from("mundane_workspaces")
      .select("id, name, description, tradition, is_active, created_at, owner_id")
      .in("id", memberOnlyIds)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    memberWorkspaces = mw ?? [];
  }

  const allIds = [...(owned ?? []), ...memberWorkspaces].map((w) => w.id);
  let memberCounts: Record<string, number> = {};
  if (allIds.length > 0) {
    const { data: counts } = await admin
      .from("mundane_workspace_members")
      .select("workspace_id")
      .in("workspace_id", allIds);
    if (counts) {
      memberCounts = counts.reduce<Record<string, number>>((acc, row) => {
        acc[row.workspace_id] = (acc[row.workspace_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  const roleMap: Record<string, string> = {};
  for (const r of memberRows ?? []) {
    roleMap[r.workspace_id] = r.role;
  }

  return [
    ...(owned ?? []).map((w) => ({ ...w, my_role: "super_admin", member_count: memberCounts[w.id] ?? 0 })),
    ...memberWorkspaces.map((w) => ({ ...w, my_role: roleMap[w.id] ?? "viewer", member_count: memberCounts[w.id] ?? 0 })),
  ];
}

export default async function WorkspacesPage() {
  const user = await getAdminUser();
  if (!user) redirect("/login");

  const workspaces = await getWorkspaces(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-indigo-500" />
            Workspaces
          </h1>
          <p className="text-muted-foreground">Collaborative teams for mundane astrology research.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane">Back to Hub</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/mundane/workspaces/new">
              <Plus className="mr-1.5 size-4" /> New Workspace
            </Link>
          </Button>
        </div>
      </div>

      {/* Workspace list */}
      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No workspaces yet</p>
            <p className="text-sm text-muted-foreground">Create a workspace to collaborate with your team.</p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/workspaces/new">
                <Plus className="mr-1.5 size-4" /> New Workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/admin/mundane/workspaces/${ws.id}`}
              className="group rounded-xl border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate group-hover:underline">{ws.name}</h3>
                <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              {ws.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ws.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${TRADITION_BADGE[ws.tradition] ?? ""}`}
                >
                  {ws.tradition}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${ROLE_BADGE[ws.my_role] ?? ""}`}
                >
                  {ws.my_role.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {ws.member_count} member{ws.member_count !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(ws.created_at)}</span>
              </div>
              {!ws.is_active && (
                <Badge variant="outline" className="text-xs text-muted-foreground mt-2">
                  Inactive
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
