import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { RouteTracker } from "@/components/shared/route-tracker";
import { MobileNav } from "@/components/community/mobile-nav";
import { NavLink } from "@/components/shared/nav-link";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { SectionContainer } from "@/components/shared/section-container";

export const metadata = { title: "Trainee Portal - AstrologyPro" };

export default async function TraineeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, username, training_status, onboarding_completed, mentor_diviner_id, graduated_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");
  if (!trainee.onboarding_completed) redirect("/join/trainee/profile");

  const portals = await getUserPortals(supabase, user.id);

  const navLinks = [
    { label: "Dashboard", href: "/trainee" },
    { label: "Training", href: "/trainee/training" },
    { label: "Sessions", href: "/trainee/sessions" },
    { label: "Progress", href: "/trainee/progress" },
    { label: "Quiz History", href: "/trainee/quiz-history" },
    { label: "Resources", href: "/trainee/resources" },
    ...(trainee.graduated_at ? [{ label: "Certificate", href: "/trainee/certificate" }] : []),
    { label: "Profile", href: "/trainee/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/trainee" />
      <header className="sticky top-0 z-40 border-b bg-background">
        <SectionContainer className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile hamburger — visible only below md */}
            <MobileNav
              membershipType="trainee"
              navItems={navLinks}
              displayName={trainee.name ?? ""}
              membershipLabel="Trainee Portal"
            />
            <Link href="/trainee" className="text-lg font-bold">AstrologyPro</Link>
            <span className="hidden text-sm text-muted-foreground md:inline">Trainee Portal</span>
            {/* Desktop nav — hidden below md */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  exact={link.href === "/trainee"}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <PortalSwitcher portals={portals} currentBase="/trainee" />
            <NotificationBell userId={user.id} />
            <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
              Account
            </Link>
            <PortalLogoutButton />
          </div>
        </SectionContainer>
      </header>
      <SectionContainer as="main" verticalPadding="md">
        {children}
      </SectionContainer>
    </div>
  );
}
