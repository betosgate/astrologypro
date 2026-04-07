import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  Plus,
  Pencil,
  Eye,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  CreditCard,
} from "lucide-react";

export const metadata = { title: "Diviners — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface DivinersSearchParams {
  q?: string;
  status?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ isActive, accountStatus }: { isActive: boolean; accountStatus?: string | null }) {
  const status = accountStatus ?? (isActive ? "active" : "inactive");
  const s = status.toLowerCase();

  const map: Record<string, string> = {
    active:    "bg-green-500/10 text-green-700 dark:text-green-400",
    inactive:  "bg-gray-500/10 text-gray-600",
    suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    locked:    "bg-red-500/10 text-red-700 dark:text-red-400",
    draft:     "bg-blue-500/10 text-blue-700",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getDiviners(params: DivinersSearchParams) {
  const admin = createAdminClient();

  const q = params.q?.trim() ?? "";
  const statusFilter = params.status ?? "all";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("diviners")
    .select(
      "id, user_id, display_name, username, avatar_url, account_status, is_active, " +
      "charges_enabled, google_calendar_connected, is_certified, onboarding_completed, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (statusFilter === "active")    query = query.eq("is_active", true);
  if (statusFilter === "suspended") query = query.eq("account_status", "suspended");

  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,username.ilike.%${q}%`
    );
  }

  const { data: divinersRaw } = await query;
  const diviners = (divinersRaw ?? []) as Array<Record<string, unknown>>;

  // Fetch affiliate counts per diviner from user_relationships
  const userIds = diviners.map((d) => d.user_id as string).filter(Boolean);

  let affiliateCountMap: Record<string, number> = {};
  let emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const [relRes, authRes] = await Promise.all([
      Promise.resolve(
        admin
          .from("user_relationships")
          .select("parent_user_id")
          .in("parent_user_id", userIds)
          .eq("relationship_type", "affiliate")
      ).catch(() => ({ data: [] as unknown[] })),

      Promise.resolve(
        admin.rpc("get_auth_users_by_ids", { user_ids: userIds })
      ).catch(() => ({ data: [] as unknown[] })),
    ]);

    for (const rel of ((relRes as { data?: unknown }).data as Array<Record<string, unknown>>) ?? []) {
      const pid = rel.parent_user_id as string;
      affiliateCountMap[pid] = (affiliateCountMap[pid] ?? 0) + 1;
    }

    for (const u of ((authRes as { data?: unknown }).data as Array<Record<string, unknown>>) ?? []) {
      emailMap[u.user_id as string] = u.email as string ?? "";
    }
  }

  return diviners.map((d) => ({
    id:                       d.id as string,
    userId:                   d.user_id as string,
    displayName:              (d.display_name as string) ?? "—",
    username:                 (d.username as string) ?? "",
    email:                    emailMap[d.user_id as string] ?? "",
    accountStatus:            (d.account_status as string) ?? undefined,
    isActive:                 !!(d.is_active as boolean),
    chargesEnabled:           !!(d.charges_enabled as boolean),
    calendarConnected:        !!(d.google_calendar_connected as boolean),
    isCertified:              !!(d.is_certified as boolean),
    onboardingCompleted:      !!(d.onboarding_completed as boolean),
    affiliateCount:           affiliateCountMap[d.user_id as string] ?? 0,
    joinedAt:                 d.created_at as string,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDivinersPage({
  searchParams,
}: {
  searchParams: Promise<DivinersSearchParams>;
}) {
  const params = await searchParams;
  const diviners = await getDiviners(params);

  const statusFilter = params.status ?? "all";
  const STATUS_TABS = ["all", "active", "suspended"];

  const counts: Record<string, number> = {
    all:       diviners.length,
    active:    diviners.filter((d) => d.isActive).length,
    suspended: diviners.filter((d) => d.accountStatus === "suspended").length,
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diviners</h1>
          <p className="text-sm text-muted-foreground">
            All astrologers and tarot readers on the platform.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/invitations?role=diviner">
            <Plus className="mr-1.5 size-4" />
            Add Diviner
          </Link>
        </Button>
      </div>

      {/* ── Status filter tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b pb-3">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin/diviners${tab === "all" ? "" : `?status=${tab}`}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              statusFilter === tab
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab}
            <Badge
              variant="secondary"
              className="ml-1.5 h-5 min-w-5 px-1 text-xs"
            >
              {counts[tab] ?? 0}
            </Badge>
          </Link>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-4 text-amber-500" />
            {statusFilter === "all" ? "All Diviners" : `${statusFilter} Diviners`}
            <Badge variant="secondary" className="ml-1">{diviners.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diviners.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Star className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No diviners found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diviner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1" title="Stripe payments connected">
                        <CreditCard className="size-3.5" />
                        Stripe
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1" title="Google Calendar connected">
                        <CalendarCheck className="size-3.5" />
                        Calendar
                      </span>
                    </TableHead>
                    <TableHead>Affiliates</TableHead>
                    <TableHead>Certified</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diviners.map((diviner) => (
                    <TableRow key={diviner.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{diviner.displayName}</p>
                          <p className="text-xs text-muted-foreground">{diviner.email || `@${diviner.username}`}</p>
                          {diviner.username && diviner.email && (
                            <p className="text-xs text-muted-foreground">@{diviner.username}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          isActive={diviner.isActive}
                          accountStatus={diviner.accountStatus}
                        />
                      </TableCell>
                      <TableCell>
                        {diviner.chargesEnabled ? (
                          <CheckCircle2 className="size-4 text-green-600" />
                        ) : (
                          <XCircle className="size-4 text-muted-foreground/40" />
                        )}
                      </TableCell>
                      <TableCell>
                        {diviner.calendarConnected ? (
                          <CheckCircle2 className="size-4 text-green-600" />
                        ) : (
                          <XCircle className="size-4 text-muted-foreground/40" />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{diviner.affiliateCount}</span>
                      </TableCell>
                      <TableCell>
                        {diviner.isCertified ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 text-xs"
                          >
                            Certified
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(diviner.joinedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/users/${diviner.userId}`}>
                              <Eye className="size-3.5" />
                              <span className="sr-only">View detail</span>
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/users/edit/${diviner.userId}`}>
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
