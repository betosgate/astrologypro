import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Sparkles,
  User,
} from "lucide-react";

export const metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  // Fetch stats in parallel
  const [bookingsResult, clientsResult, revenueResult, upcomingResult] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", diviner.id),
      supabase
        .from("client_diviners")
        .select("id", { count: "exact", head: true })
        .eq("diviner_id", diviner.id),
      supabase
        .from("bookings")
        .select("amount")
        .eq("diviner_id", diviner.id)
        .eq("status", "completed"),
      supabase
        .from("bookings")
        .select(
          "id, scheduled_at, status, amount, services(name), clients(display_name, email)"
        )
        .eq("diviner_id", diviner.id)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5),
    ]);

  const totalBookings = bookingsResult.count ?? 0;
  const totalClients = clientsResult.count ?? 0;
  const totalRevenue =
    revenueResult.data?.reduce((sum, b) => sum + (b.amount ?? 0), 0) ?? 0;
  const upcomingBookings = upcomingResult.data ?? [];

  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      description: "All time",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue / 100),
      icon: DollarSign,
      description: "Completed sessions",
    },
    {
      label: "Total Clients",
      value: totalClients,
      icon: Users,
      description: "Unique clients",
    },
    {
      label: "Upcoming",
      value: upcomingBookings.length,
      icon: TrendingUp,
      description: "Scheduled sessions",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is an overview of your practice.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {stat.label}
                </CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>
              Your next scheduled sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming bookings yet.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {booking.clients?.display_name ?? booking.clients?.email ?? "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.services?.name} &middot;{" "}
                        {formatDateTime(booking.scheduled_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "confirmed" ? "default" : "secondary"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/dashboard/bookings">
                  <span className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    View Bookings
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/dashboard/profile">
                  <span className="flex items-center gap-2">
                    <User className="size-4" />
                    Edit Profile
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/dashboard/services">
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Manage Services
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
