import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddSubscriberForm } from "./add-subscriber-form";

export const dynamic = "force-dynamic";

type Subscription = {
  id: string;
  workspace_id: string;
  subscriber_email: string;
  plan: string;
  status: string;
  access_level: string;
  subscribed_at: string;
  expires_at: string | null;
};

type Workspace = {
  id: string;
  name: string;
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const PLAN_BADGE: Record<string, string> = {
  basic: "bg-blue-100 text-blue-700 border-blue-200",
  premium: "bg-violet-100 text-violet-700 border-violet-200",
  enterprise: "bg-amber-100 text-amber-700 border-amber-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminMundaneSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; workspace_id?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const workspaceFilter = sp.workspace_id ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Get user's workspaces
  const { data: workspaces } = await admin
    .from("mundane_workspaces")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("name");

  const ownedWorkspaces = (workspaces ?? []) as Workspace[];
  const ownedIds = ownedWorkspaces.map((w) => w.id);

  let subscriptions: Subscription[] = [];
  let total = 0;

  if (ownedIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = admin
      .from("mundane_subscriptions")
      .select(
        "id, workspace_id, subscriber_email, plan, status, access_level, subscribed_at, expires_at",
        { count: "exact" }
      )
      .in("workspace_id", ownedIds);

    if (workspaceFilter && ownedIds.includes(workspaceFilter)) {
      query = query.eq("workspace_id", workspaceFilter);
    }

    const { data, count } = await query
      .order("subscribed_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    subscriptions = (data ?? []) as Subscription[];
    total = count ?? 0;
  }

  const hasMore = offset + limit < total;
  const hasPrev = page > 1;
  const workspaceMap = Object.fromEntries(ownedWorkspaces.map((w) => [w.id, w.name]));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-sky-500" />
            Subscribers
          </h1>
          <p className="text-muted-foreground">
            Manage subscriber access to your mundane research workspaces.
          </p>
        </div>
      </div>

      {ownedWorkspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No workspaces found</p>
            <p className="text-sm text-muted-foreground">
              Create a workspace first to manage subscribers.
            </p>
            <Link
              href="/admin/mundane/workspaces/new"
              className="text-sm text-primary underline underline-offset-2"
            >
              Create a workspace
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Add subscriber form */}
          <AddSubscriberForm workspaces={ownedWorkspaces} />

          {/* Workspace filter */}
          {ownedWorkspaces.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/mundane/subscriptions">
                <Badge
                  variant={workspaceFilter === "" ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  All Workspaces
                </Badge>
              </Link>
              {ownedWorkspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/admin/mundane/subscriptions?workspace_id=${ws.id}`}
                >
                  <Badge
                    variant={workspaceFilter === ws.id ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {ws.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Users className="size-10 text-muted-foreground/40" />
                <p className="font-medium">No subscribers yet</p>
                <p className="text-sm text-muted-foreground">
                  Use the form above to add your first subscriber.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    {!workspaceFilter && (
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workspace</th>
                    )}
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Access</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Subscribed</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 max-w-[200px] truncate">{sub.subscriber_email}</td>
                      {!workspaceFilter && (
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                          {workspaceMap[sub.workspace_id] ?? sub.workspace_id}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${PLAN_BADGE[sub.plan] ?? ""}`}
                        >
                          {sub.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${STATUS_BADGE[sub.status] ?? ""}`}
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize text-xs">
                        {sub.access_level}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        {formatDate(sub.subscribed_at)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                        {sub.expires_at ? formatDate(sub.expires_at) : "—"}
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
                <Link href={`/admin/mundane/subscriptions?page=${page - 1}&workspace_id=${workspaceFilter}`}>
                  <button className="px-3 py-1 rounded border hover:bg-muted/40 text-sm">Previous</button>
                </Link>
              )}
              <span>Page {page} of {Math.ceil(total / limit)}</span>
              {hasMore && (
                <Link href={`/admin/mundane/subscriptions?page=${page + 1}&workspace_id=${workspaceFilter}`}>
                  <button className="px-3 py-1 rounded border hover:bg-muted/40 text-sm">Next</button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
