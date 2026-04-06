import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Navigation, Building2, TrendingUp, ArrowRight, Plus, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mundane Dashboard — Admin" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SIGNAL_BADGE: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

export default async function AdminMundaneDashboardPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthISO = startOfMonth.toISOString().slice(0, 10);

  const [
    entityCountRes,
    ingressThisMonthRes,
    publishedForecastsRes,
    pendingForecastsRes,
    recentIngressRes,
    recentEntitiesRes,
    recentForecastsRes,
  ] = await Promise.all([
    admin.from("mundane_entities").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin
      .from("ingress_charts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("validity_start", startOfMonthISO),
    admin
      .from("mundane_forecasts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("forecast_period_end", today),
    admin
      .from("mundane_forecasts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", false),
    admin
      .from("ingress_charts")
      .select("id, title, ingress_type, importance, validity_start, is_published")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("mundane_entities")
      .select("id, name, entity_type, flag_emoji, region")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("mundane_forecasts")
      .select("id, title, forecast_type, forecast_period_start, signal_strength, is_published")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      label: "Active Entities",
      value: entityCountRes.count ?? 0,
      icon: <Building2 className="size-4 text-muted-foreground" />,
      href: "/admin/mundane-entities",
    },
    {
      label: "Ingress Charts (this month)",
      value: ingressThisMonthRes.count ?? 0,
      icon: <Navigation className="size-4 text-muted-foreground" />,
      href: "/admin/ingress-charts",
    },
    {
      label: "Active Forecasts",
      value: publishedForecastsRes.count ?? 0,
      icon: <TrendingUp className="size-4 text-muted-foreground" />,
      href: "/admin/mundane-forecasts",
    },
    {
      label: "Pending Forecasts",
      value: pendingForecastsRes.count ?? 0,
      icon: <BookOpen className="size-4 text-muted-foreground" />,
      href: "/admin/mundane-forecasts?published=false",
    },
  ];

  const IMPORTANCE_BADGE: Record<string, string> = {
    "High Impact": "bg-red-100 text-red-700 border-red-200",
    "Medium Impact": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Low Impact": "bg-green-100 text-green-700 border-green-200",
  };

  type IngressRow = {
    id: string;
    title: string;
    ingress_type: string | null;
    importance: string | null;
    validity_start: string | null;
    is_published: boolean;
  };

  type EntityRow = {
    id: string;
    name: string;
    entity_type: string;
    flag_emoji: string | null;
    region: string | null;
  };

  type ForecastRow = {
    id: string;
    title: string;
    forecast_type: string;
    forecast_period_start: string;
    signal_strength: string | null;
    is_published: boolean;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mundane Astrology Hub</h1>
        <p className="text-muted-foreground">
          Manage ingress charts, entity registry, and forecasts.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="transition-colors hover:border-border/80 hover:bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                {s.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 pt-4">
            <div className="flex items-center gap-2">
              <Navigation className="size-4 text-violet-500" />
              <span className="font-medium text-sm">Ingress Charts</span>
            </div>
            <p className="text-xs text-muted-foreground">Manage planetary ingress publications and seasonal charts.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/ingress-charts">
                  <Globe className="mr-1.5 size-3.5" /> Manage
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/admin/ingress-charts/new">
                  <Plus className="mr-1.5 size-3.5" /> New
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-blue-500" />
              <span className="font-medium text-sm">Entity Registry</span>
            </div>
            <p className="text-xs text-muted-foreground">Countries, cities, institutions, and markets under watch.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/mundane-entities">
                  <Building2 className="mr-1.5 size-3.5" /> Manage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              <span className="font-medium text-sm">Forecasts</span>
            </div>
            <p className="text-xs text-muted-foreground">Publish mundane forecasts by type and entity.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/mundane-forecasts">
                  <TrendingUp className="mr-1.5 size-3.5" /> Manage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent ingress charts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Ingress Charts</CardTitle>
              <CardDescription>Last 5 created</CardDescription>
            </div>
            <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground gap-1">
              <Link href="/admin/ingress-charts">
                All <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentIngressRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No charts yet</p>
            ) : (
              (recentIngressRes.data as IngressRow[]).map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.ingress_type && (
                        <span className="text-xs text-muted-foreground">{c.ingress_type}</span>
                      )}
                      {c.validity_start && (
                        <span className="text-xs text-muted-foreground">{formatDate(c.validity_start)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.importance && (
                      <Badge variant="outline" className={`text-xs ${IMPORTANCE_BADGE[c.importance] ?? ""}`}>
                        {c.importance.replace(" Impact", "")}
                      </Badge>
                    )}
                    {!c.is_published && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent entities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Entity Registry</CardTitle>
              <CardDescription>Recently added</CardDescription>
            </div>
            <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground gap-1">
              <Link href="/admin/mundane-entities">
                All <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentEntitiesRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No entities yet</p>
            ) : (
              (recentEntitiesRes.data as EntityRow[]).map((e) => (
                <Link key={e.id} href={`/admin/mundane-entities/${e.id}`} className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted/50 transition-colors">
                  {e.flag_emoji && <span className="text-base">{e.flag_emoji}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.name}</p>
                    {e.region && <p className="text-xs text-muted-foreground truncate">{e.region}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 capitalize">{e.entity_type}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent forecasts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Forecasts</CardTitle>
              <CardDescription>Recently created</CardDescription>
            </div>
            <Button size="sm" variant="ghost" asChild className="text-xs text-muted-foreground gap-1">
              <Link href="/admin/mundane-forecasts">
                All <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentForecastsRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No forecasts yet</p>
            ) : (
              (recentForecastsRes.data as ForecastRow[]).map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{f.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">{f.forecast_type}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(f.forecast_period_start)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {f.signal_strength && (
                      <Badge variant="outline" className={`text-xs capitalize ${SIGNAL_BADGE[f.signal_strength] ?? ""}`}>
                        {f.signal_strength}
                      </Badge>
                    )}
                    {!f.is_published && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
