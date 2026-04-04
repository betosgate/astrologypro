import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-muted-foreground">AstrologyPro</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold">Admin</span>
            <nav className="flex items-center gap-1 ml-2 flex-wrap">
              <a href="/admin" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Analytics</a>
              <a href="/admin/users" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Users</a>
              <a href="/admin/training" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Training</a>
              <a href="/admin/packages" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Packages</a>
              <a href="/admin/webinars" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Webinars</a>
              <a href="/admin/tarot" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Tarot</a>
              <a href="/admin/rituals" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Rituals</a>
              <a href="/admin/wheel-signs" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Wheel Signs</a>
              <a href="/admin/calendar" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Calendar</a>
              <a href="/admin/mandalism" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Mandalism</a>
              <a href="/admin/refunds" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Refunds</a>
              <a href="/admin/sunday-service" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Sunday Service</a>
              <a href="/admin/mystery-school" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Mystery School</a>
              <a href="/admin/ingress-charts" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Ingress Charts</a>
              <a href="/admin/social-advocacy" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Social Advocacy</a>
              <a href="/admin/spiritual-wisdom" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Spiritual Wisdom</a>
              <a href="/admin/decan-journals" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Decan Journals</a>
              <a href="/admin/decan-media" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Decan Media</a>
              <a href="/admin/payments" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Payments</a>
              <a href="/admin/training/analytics" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Training Analytics</a>
              <a href="/admin/blog" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Blog</a>
              <a href="/admin/roles" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Roles</a>
              <a href="/admin/broadcasting" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Broadcasting</a>
              <a href="/admin/videos" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Videos</a>
              <a href="/admin/orders" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Orders</a>
              <a href="/admin/reports" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Reports</a>
              <a href="/admin/quarters" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Quarters</a>
              <a href="/admin/class-config" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Class Config</a>
              <a href="/admin/general-content" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">General Content</a>
              <a href="/admin/perennial-content" className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Perennial Content</a>
            </nav>
          </div>
          <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            ← Dashboard
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
