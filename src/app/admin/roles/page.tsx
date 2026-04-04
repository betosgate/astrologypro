import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Users,
  UserCheck,
  Megaphone,
  BookOpen,
  GraduationCap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const metadata = { title: "Roles — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleStats {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  usersHref: string;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getRoleStats(): Promise<RoleStats[]> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [
    divinersRes,
    divinersActiveRes,
    divinersNewRes,
    clientsRes,
    clientsNewRes,
    advocatesRes,
    advocatesActiveRes,
    advocatesNewRes,
    perennialRes,
    perennialActiveRes,
    perennialNewRes,
    mysteryRes,
    mysteryActiveRes,
    mysteryNewRes,
    traineesRes,
    traineesActiveRes,
    traineesNewRes,
  ] = await Promise.all([
    // Diviners — total
    admin.from("diviners").select("id", { count: "exact", head: true }),
    // Diviners — active
    admin.from("diviners").select("id", { count: "exact", head: true }).eq("is_active", true),
    // Diviners — new last 30 days
    admin.from("diviners").select("id", { count: "exact", head: true }).gte("created_at", cutoff),

    // Clients — total
    admin.from("clients").select("id", { count: "exact", head: true }),
    // Clients — new last 30 days
    admin.from("clients").select("id", { count: "exact", head: true }).gte("created_at", cutoff),

    // Social Advocates — total
    admin.from("social_advocates").select("id", { count: "exact", head: true }),
    // Social Advocates — active
    admin.from("social_advocates").select("id", { count: "exact", head: true }).eq("is_active", true),
    // Social Advocates — new last 30 days
    admin.from("social_advocates").select("id", { count: "exact", head: true }).gte("created_at", cutoff),

    // Community Perennial — total
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "perennial_mandalism"),
    // Community Perennial — active
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "perennial_mandalism").eq("membership_status", "active"),
    // Community Perennial — new last 30 days
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "perennial_mandalism").gte("joined_at", cutoff),

    // Community Mystery — total
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "mystery_school"),
    // Community Mystery — active
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "mystery_school").eq("membership_status", "active"),
    // Community Mystery — new last 30 days
    admin.from("community_members").select("id", { count: "exact", head: true }).eq("membership_type", "mystery_school").gte("joined_at", cutoff),

    // Trainees — total
    admin.from("trainees").select("id", { count: "exact", head: true }),
    // Trainees — active
    admin.from("trainees").select("id", { count: "exact", head: true }).eq("training_status", "active"),
    // Trainees — new last 30 days
    admin.from("trainees").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
  ]);

  const divinersTotal   = divinersRes.count ?? 0;
  const divinersActive  = divinersActiveRes.count ?? 0;
  const clientsTotal    = clientsRes.count ?? 0;
  const advocatesTotal  = advocatesRes.count ?? 0;
  const advocatesActive = advocatesActiveRes.count ?? 0;
  const perennialTotal  = perennialRes.count ?? 0;
  const perennialActive = perennialActiveRes.count ?? 0;
  const mysteryTotal    = mysteryRes.count ?? 0;
  const mysteryActive   = mysteryActiveRes.count ?? 0;
  const traineesTotal   = traineesRes.count ?? 0;
  const traineesActive  = traineesActiveRes.count ?? 0;

  return [
    {
      key: "diviner",
      label: "Diviners",
      description: "Certified and active astrologers & tarot readers offering readings on the platform.",
      icon: <Star className="size-5" />,
      color: "text-amber-500",
      total:        divinersTotal,
      active:       divinersActive,
      inactive:     divinersTotal - divinersActive,
      newThisMonth: divinersNewRes.count ?? 0,
      usersHref:    "/admin/users?role=diviner",
    },
    {
      key: "client",
      label: "Clients",
      description: "Registered users who book and attend reading sessions.",
      icon: <Users className="size-5" />,
      color: "text-blue-500",
      total:        clientsTotal,
      active:       clientsTotal, // clients have no is_active flag
      inactive:     0,
      newThisMonth: clientsNewRes.count ?? 0,
      usersHref:    "/admin/users?role=client",
    },
    {
      key: "advocate",
      label: "Social Advocates",
      description: "Referral partners who promote the platform and earn from referred signups.",
      icon: <Megaphone className="size-5" />,
      color: "text-purple-500",
      total:        advocatesTotal,
      active:       advocatesActive,
      inactive:     advocatesTotal - advocatesActive,
      newThisMonth: advocatesNewRes.count ?? 0,
      usersHref:    "/admin/users?role=advocate",
    },
    {
      key: "perennial",
      label: "Perennial Mandalism",
      description: "Community members enrolled in the Perennial Mandalism subscription program.",
      icon: <BookOpen className="size-5" />,
      color: "text-emerald-500",
      total:        perennialTotal,
      active:       perennialActive,
      inactive:     perennialTotal - perennialActive,
      newThisMonth: perennialNewRes.count ?? 0,
      usersHref:    "/admin/users?role=community",
    },
    {
      key: "mystery",
      label: "Mystery School",
      description: "Community members enrolled in the Mystery School subscription program.",
      icon: <UserCheck className="size-5" />,
      color: "text-violet-500",
      total:        mysteryTotal,
      active:       mysteryActive,
      inactive:     mysteryTotal - mysteryActive,
      newThisMonth: mysteryNewRes.count ?? 0,
      usersHref:    "/admin/users?role=community",
    },
    {
      key: "trainee",
      label: "Trainees",
      description: "Users enrolled in divination training courses and apprenticeships.",
      icon: <GraduationCap className="size-5" />,
      color: "text-rose-500",
      total:        traineesTotal,
      active:       traineesActive,
      inactive:     traineesTotal - traineesActive,
      newThisMonth: traineesNewRes.count ?? 0,
      usersHref:    "/admin/users?role=trainee",
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminRolesPage() {
  const roles = await getRoleStats();

  const totalUsers     = roles.reduce((s, r) => s + r.total, 0);
  const totalNewMonth  = roles.reduce((s, r) => s + r.newThisMonth, 0);
  const totalActive    = roles.reduce((s, r) => s + r.active, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles Overview</h1>
          <p className="text-sm text-muted-foreground">
            All system roles and their current user counts.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <Users className="mr-1.5 size-4" />
            View All Users
          </Link>
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</p>
            <p className="text-3xl font-bold mt-1">{totalUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
            <p className="text-3xl font-bold mt-1">{totalActive.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">New (30d)</p>
            </div>
            <p className="text-3xl font-bold mt-1">{totalNewMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.key} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className={role.color}>{role.icon}</span>
                {role.label}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {role.total.toLocaleString()}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {role.description}
              </p>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
              {/* Stat row */}
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-lg font-bold">{role.total.toLocaleString()}</p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</p>
                  <p className="text-lg font-bold text-emerald-500">{role.active.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">New 30d</p>
                  <p className="text-lg font-bold text-amber-500">{role.newThisMonth.toLocaleString()}</p>
                </div>
              </div>

              {/* Active bar */}
              {role.total > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Active rate</span>
                    <span>{Math.round((role.active / role.total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.round((role.active / role.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {role.inactive > 0 && (
                <p className="text-xs text-muted-foreground">
                  {role.inactive.toLocaleString()} inactive
                </p>
              )}

              {/* CTA */}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-between mt-auto text-xs"
              >
                <Link href={role.usersHref}>
                  View {role.label}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
