import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import Link from "next/link";
import { RouteTracker } from "@/components/shared/route-tracker";
import { NavLink } from "@/components/shared/nav-link";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { SectionContainer } from "@/components/shared/section-container";

export const metadata = { title: "Advocate Portal - AstrologyPro" };

export default async function AdvocateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, name, username, onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");
  if (!advocate.onboarding_completed) redirect("/join/advocate?step=profile");

  const portals = await getUserPortals(supabase, user.id);

  const navLinks = [
    { label: "Dashboard", href: "/advocate" },
    { label: "Referrals", href: "/advocate/referrals" },
    { label: "Earnings", href: "/advocate/earnings" },
    { label: "Analytics", href: "/advocate/analytics" },
    { label: "Reports", href: "/advocate/reports" },
    { label: "Campaigns", href: "/advocate/campaigns" },
    { label: "Content", href: "/advocate/content" },
    { label: "Profile", href: "/advocate/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/advocate" />
      <header className="sticky top-0 z-40 border-b bg-background">
        <SectionContainer className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/advocate" className="text-lg font-bold">AstrologyPro</Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">Advocate Portal</span>
            <nav className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  exact={link.href === "/advocate"}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <PortalSwitcher portals={portals} currentBase="/advocate" />
            <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
              Account
            </Link>
            <PortalLogoutButton />
          </div>
        </SectionContainer>
        <nav className="flex items-center gap-1 border-t px-4 sm:hidden">
          {navLinks.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <SectionContainer as="main" verticalPadding="md">
        {children}
      </SectionContainer>
    </div>
  );
}
