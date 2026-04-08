import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { RouteTracker } from "@/components/shared/route-tracker";
import { MobileNav } from "@/components/community/mobile-nav";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const metadata = { title: "Mystery School - AstrologyPro" };

export default async function MysterySchoolLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await requireMysterySchoolAccess();
  if (!result) redirect("/mystery-school/enroll");

  const { data: member } = await supabase
    .from("community_members")
    .select("full_name, membership_type")
    .eq("user_id", user.id)
    .maybeSingle();

  const portals = await getUserPortals(supabase, user.id);

  const navLinks = [
    { label: "Decans", href: "/mystery-school" },
    { label: "Training", href: "/mystery-school/training" },
    { label: "Graduation", href: "/mystery-school/training/graduation" },
    { label: "Mundane", href: "/community/mundane" },
    { label: "Ingress Charts", href: "/community/ingress-charts" },
    { label: "Horoscope", href: "/community/horoscope" },
    { label: "Library", href: "/community/library" },
    { label: "Profile", href: "/community/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/mystery-school" />
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-6">
            <MobileNav
              membershipType={member?.membership_type ?? "mystery_school"}
              navItems={navLinks}
              displayName={member?.full_name ?? ""}
              membershipLabel="Mystery School"
            />
            <Link href="/mystery-school" className="text-lg font-bold">AstrologyPro</Link>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary md:inline">
              Mystery School
            </span>
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <PortalSwitcher portals={portals} currentBase="/mystery-school" />
            <NotificationBell userId={user.id} />
            <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
              Account
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl p-4 py-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
