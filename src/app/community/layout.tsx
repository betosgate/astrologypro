import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { RouteTracker } from "@/components/shared/route-tracker";
import { MobileNav } from "@/components/community/mobile-nav";

export const metadata = { title: "Community - AstrologyPro" };

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use maybeSingle so a missing membership row redirects cleanly instead of
  // throwing a PostgREST single-row error.
  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_type, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  const portals = await getUserPortals(supabase, user.id);
  const membershipLabel = "Perennial Mandalism";

  const navLinks = [
    { label: "Home", href: "/community" },
    { label: "Sessions", href: "/community/sessions" },
    { label: "Broadcasts", href: "/community/broadcasts" },
    { label: "Events", href: "/community/events" },
    { label: "Resources", href: "/community/resources" },
    { label: "My Plan", href: "/community/plan" },
    { label: "Family", href: "/community/family" },
    { label: "Charts", href: "/community/charts" },
    { label: "Transits", href: "/community/transits" },
    { label: "Rituals", href: "/community/rituals" },
    { label: "Tarot", href: "/community/tarot" },
    { label: "Mundane", href: "/community/mundane" },
    { label: "Ingress Charts", href: "/community/ingress-charts" },
    { label: "Horoscope", href: "/community/horoscope" },
    { label: "Service", href: "/community/sunday-service" },
    { label: "Library", href: "/community/library" },
    { label: "Profile", href: "/community/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/community" />
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile hamburger — visible only below md */}
            <MobileNav
              membershipType={member.membership_type}
              navItems={navLinks}
              displayName={member.full_name ?? ""}
              membershipLabel={membershipLabel}
            />
            <Link href="/community" className="text-lg font-bold">AstrologyPro</Link>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary md:inline">
              {membershipLabel}
            </span>
            {/* Desktop nav — hidden below md */}
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
            <PortalSwitcher portals={portals} currentBase="/community" />
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
