import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
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
  ArrowLeft,
  Star,
  Users,
  CalendarCheck,
  CreditCard,
  ExternalLink,
  Pencil,
  ShoppingBag,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PublishingControls } from "./publishing-controls";
import { normalizePublishPolicy } from "@/lib/diviner-publishing";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { buildGovernedLivePlatforms } from "@/lib/live-platform-governance";
import { LivePlatformOverrides } from "./live-platform-overrides";
import {
  getRoleServicePackages,
  resolveRoleServicePackage,
} from "@/lib/role-service-packages";

export const metadata = { title: "Diviner Detail — Admin" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ isActive, accountStatus }: { isActive: boolean; accountStatus?: string | null }) {
  const status = accountStatus ?? (isActive ? "active" : "inactive");
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    inactive: "bg-gray-500/10 text-gray-600",
    suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    locked: "bg-red-500/10 text-red-700 dark:text-red-400",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ─── Data fetch ──────────────────────────────────────────────────────────────

async function getDivinerDetail(divinerId: string) {
  const admin = createAdminClient();

  const { data: diviner, error } = await admin
    .from("diviners")
    .select("*")
    .eq("id", divinerId)
    .single();

  if (error || !diviner) return null;

  // Fetch related data in parallel
  const [servicesRes, bookingsRes, affiliateCountRes, orderStatsRes, emailRes, registryRes, overrideRes] =
    await Promise.all([
      admin
        .from("services")
        .select("id, name, category, base_price, duration_minutes, is_active, sort_order")
        .eq("diviner_id", divinerId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      admin
        .from("bookings")
        .select("id, client_id, service_id, start_time, status, created_at")
        .eq("diviner_id", divinerId)
        .order("start_time", { ascending: false })
        .limit(10),

      admin
        .from("user_relationships")
        .select("id", { count: "exact", head: true })
        .eq("parent_user_id", diviner.user_id)
        .eq("relationship_type", "affiliate"),

      admin
        .from("orders")
        .select("id, amount_cents, status")
        .eq("diviner_id", divinerId),

      diviner.user_id
        ? admin.rpc("get_auth_users_by_ids", {
            user_ids: [diviner.user_id],
          })
        : Promise.resolve({ data: [] }),
      admin
        .from("live_platform_registry")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("platform_key", { ascending: true }),
      admin
        .from("diviner_live_platform_overrides")
        .select("*")
        .eq("diviner_id", divinerId),
    ]);

  const services = (servicesRes.data ?? []) as Array<Record<string, unknown>>;
  const bookings = (bookingsRes.data ?? []) as Array<Record<string, unknown>>;
  const affiliateCount = affiliateCountRes.count ?? 0;

  // Compute order stats
  const orders = (orderStatsRes.data ?? []) as Array<Record<string, unknown>>;
  const totalRevenue = orders.reduce(
    (s, o) => s + (Number(o.amount_cents) || 0),
    0
  );
  const totalOrders = orders.length;

  // Unique clients from bookings
  const uniqueClients = new Set(
    bookings.map((b) => b.client_id as string).filter(Boolean)
  );

  // Get email
  const emailArr = (emailRes.data ?? []) as Array<Record<string, unknown>>;
  const email = emailArr.length > 0 ? (emailArr[0].email as string) : "";

  return {
    diviner,
    email,
    services,
    bookings,
    affiliateCount,
    governedLivePlatforms: buildGovernedLivePlatforms(
      registryRes.data ?? [],
      overrideRes.data ?? []
    ),
    stats: {
      totalOrders,
      totalRevenue,
      totalServices: services.length,
      totalClients: uniqueClients.size,
    },
    servicePackage: resolveRoleServicePackage(
      await getRoleServicePackages(),
      diviner.service_package_code,
    ),
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDivinerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDivinerDetail(id);
  if (!result) notFound();

  const { diviner, email, services, bookings, affiliateCount, governedLivePlatforms, stats, servicePackage } = result;
  const publishingPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  const divinerAvatarUrl = getDivinerAvatarUrl(diviner.avatar_url as string | null | undefined);

  return (
    <div className="space-y-6">
      {/* ── Back + Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/diviners">
            <ArrowLeft className="mr-1.5 size-4" />
            Diviners
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={divinerAvatarUrl}
            alt={diviner.display_name ?? "Diviner"}
            width={64}
            height={64}
            className="size-16 rounded-full object-cover border"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {diviner.display_name ?? "—"}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{diviner.username ?? "—"}
              {email && <span className="ml-2">{email}</span>}
            </p>
            {diviner.phone && (
              <p className="text-xs text-muted-foreground">{diviner.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Service package: {servicePackage.displayName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge
            isActive={!!diviner.is_active}
            accountStatus={diviner.account_status}
          />
          {diviner.is_certified && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 text-xs"
            >
              Certified
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${diviner.username}`}>
              <ExternalLink className="mr-1.5 size-3.5" />
              Public Page
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/users/${diviner.user_id}`}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit User
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Bio ────────────────────────────────────────────────────────── */}
      {diviner.bio && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{diviner.bio}</p>
          </CardContent>
        </Card>
      )}

      <PublishingControls divinerId={diviner.id} initialPolicy={publishingPolicy} />
      <LivePlatformOverrides
        divinerId={diviner.id}
        initialPlatforms={governedLivePlatforms}
      />

      {/* ── Stats Cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(stats.totalRevenue / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalServices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{affiliateCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Connection Status ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stripe</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {diviner.charges_enabled ? (
              <>
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground">
                  Not connected
                </span>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calendar</CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {diviner.google_calendar_connected ? (
              <>
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground">
                  Not connected
                </span>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm capitalize">
              {diviner.subscription_status ?? "—"}
            </p>
            {diviner.plan_id && (
              <p className="text-xs text-muted-foreground mt-1">
                Plan: {diviner.plan_id}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Services List ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" />
            Services
            <Badge variant="secondary" className="ml-1">
              {services.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No services found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((svc) => (
                    <TableRow key={svc.id as string}>
                      <TableCell className="font-medium">
                        {svc.name as string}
                      </TableCell>
                      <TableCell className="capitalize">
                        {svc.category as string}
                      </TableCell>
                      <TableCell>
                        ${Number(svc.base_price ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {(svc.duration_minutes as number) ?? "—"} min
                      </TableCell>
                      <TableCell>
                        {svc.is_active ? (
                          <CheckCircle2 className="size-4 text-green-600" />
                        ) : (
                          <XCircle className="size-4 text-muted-foreground/40" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Bookings ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="size-4" />
            Recent Bookings
            <Badge variant="secondary" className="ml-1">
              {bookings.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id as string}>
                      <TableCell className="font-mono text-xs">
                        {(b.id as string).slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {fmtDateTime(b.start_time as string)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {(b.status as string) ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(b.created_at as string)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Additional Info ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Joined: </span>
              {fmtDate(diviner.created_at)}
            </div>
            <div>
              <span className="font-medium">Onboarding: </span>
              {diviner.onboarding_completed ? "Completed" : `Step ${diviner.onboarding_step ?? 0}`}
            </div>
            <div>
              <span className="font-medium">Timezone: </span>
              {diviner.timezone ?? "—"}
            </div>
            <div>
              <span className="font-medium">Platform Fee: </span>
              {diviner.platform_fee_percent ?? "—"}%
            </div>
            {diviner.tagline && (
              <div className="sm:col-span-2">
                <span className="font-medium">Tagline: </span>
                {diviner.tagline}
              </div>
            )}
            {diviner.specialties && (diviner.specialties as string[]).length > 0 && (
              <div className="sm:col-span-2">
                <span className="font-medium">Specialties: </span>
                {(diviner.specialties as string[]).join(", ")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
