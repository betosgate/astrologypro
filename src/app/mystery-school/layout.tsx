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
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { SectionContainer } from "@/components/shared/section-container";
import { SubscriptionExpiredView } from "@/components/shared/subscription-expired-view";

export const metadata = { title: "Mystery School - AstrologyPro" };

export default async function MysterySchoolLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await requireMysterySchoolAccess();

  if (!result) {
    // Distinguish expired/cancelled students (who had access before) from
    // genuinely new users who have never enrolled.
    const { data: expiredStudent } = await supabase
      .from("mystery_school_students")
      .select("id, status, access_expires_at, stripe_subscription_id, cancelled_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const wasEnrolled =
      expiredStudent &&
      (expiredStudent.status === "cancelled" ||
        expiredStudent.status === "paused" ||
        expiredStudent.status === "expired");

    if (wasEnrolled) {
      return (
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-20 border-b bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <Link href="/mystery-school" className="text-lg font-bold">AstrologyPro</Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Mystery School</span>
                <PortalLogoutButton />
              </div>
            </div>
          </header>
          <SubscriptionExpiredView
            portalName="Mystery School"
            portalEmoji="⭐"
            membershipStatus={expiredStudent.status}
            billingPortalEndpoint="/api/mystery-school/billing-portal"
            hasStripeSubscription={!!expiredStudent.stripe_subscription_id}
            resubscribeHref="/join/mystery-school/resubscribe"
            accessEndedAt={expiredStudent.access_expires_at ?? expiredStudent.cancelled_at}
          />
        </div>
      );
    }

    // Row exists but doesn't match the wasEnrolled buckets above — e.g.
    // status='active' with no stripe_subscription_id (broken billing on
    // an otherwise-active row). Send these users to resubscribe rather
    // than first-time enrollment, so the existing row is preserved and
    // they don't pay the one-time fee twice.
    if (expiredStudent) {
      redirect("/join/mystery-school/resubscribe");
    }

    // Never enrolled — first-time enrollment flow.
    redirect("/join/mystery-school");
  }

  const { data: member } = await supabase
    .from("community_members")
    .select("full_name, membership_type")
    .eq("user_id", user.id)
    .maybeSingle();

  const portals = await getUserPortals(supabase, user.id);

  // Only include destinations that are valid for a Mystery School user.
  // /community/* routes redirect MS-only users away — removed to avoid
  // misleading nav behavior (tasks 02 + 03).
  const navLinks = [
    { label: "Training", href: "/mystery-school/training" },
    { label: "Decans", href: "/mystery-school" },
    { label: "Graduation", href: "/mystery-school/training/graduation" },
  ];

  const membershipLabel = "Mystery School";

  return (
    <div className="min-h-screen bg-background md:flex">
      <RouteTracker href="/mystery-school" />

      {/* Left sidebar — desktop only. Matches Perennial dashboard shell. */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-60 md:flex-col md:border-r md:bg-background">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href="/mystery-school" className="text-lg font-bold">
            AstrologyPro
          </Link>
        </div>
        <div className="px-4 py-3">
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {membershipLabel}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          <ul className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  exact={link.href === "/mystery-school"}
                  className="block w-full"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Logout pinned to sidebar bottom */}
        <div className="border-t px-3 py-3">
          <PortalLogoutButton />
        </div>
      </aside>

      {/* Main column — offset by sidebar width on md+ */}
      <div className="flex min-h-screen w-full flex-col md:ml-60">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            {/* Mobile-only: hamburger + wordmark */}
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav
                membershipType={member?.membership_type ?? "mystery_school"}
                navItems={navLinks}
                displayName={member?.full_name ?? ""}
                membershipLabel={membershipLabel}
              />
              <Link href="/mystery-school" className="text-lg font-bold">
                AstrologyPro
              </Link>
            </div>
            {/* Portal chrome — right-aligned on all breakpoints */}
            <div className="ml-auto flex items-center gap-2">
              <PortalSwitcher portals={portals} currentBase="/mystery-school" />
              <NotificationBell userId={user.id} />
              <Link
                href="/account"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Account
              </Link>
              {/* Mobile-only logout (sidebar handles it on desktop) */}
              <div className="md:hidden">
                <PortalLogoutButton />
              </div>
            </div>
          </div>
        </header>
        <SectionContainer as="main" verticalPadding="lg">
          {children}
        </SectionContainer>
      </div>
    </div>
  );
}
