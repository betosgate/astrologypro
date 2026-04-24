import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { RouteTracker } from "@/components/shared/route-tracker";
import { MobileNav } from "@/components/community/mobile-nav";
import { NavLink } from "@/components/shared/nav-link";
import { NavDropdown } from "@/components/shared/nav-dropdown";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { OnboardingGuard } from "@/components/community/onboarding-guard";
import { SectionContainer } from "@/components/shared/section-container";
import { SubscriptionExpiredView } from "@/components/shared/subscription-expired-view";
import { getPendingContractDestination } from "@/lib/contract-orchestration";

export const metadata = { title: "Community - AstrologyPro" };
export const dynamic = "force-dynamic";


export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Contract check
  const contractDest = await getPendingContractDestination(user.id, "/community");
  if (contractDest) redirect(contractDest);

  // Use maybeSingle so a missing membership row redirects cleanly instead of
  // throwing a PostgREST single-row error.
  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, first_name, membership_type, membership_status, onboarding_completed, stripe_subscription_id")
    .eq("user_id", user.id)
    .eq("membership_type", "perennial_mandalism")
    .maybeSingle();


  if (!member) redirect("/get-started");
  // PM-only gate: legacy Mystery School-only users must use /mystery-school
  if (member.membership_type !== "perennial_mandalism") redirect("/mystery-school");

  // Subscription expired / cancelled — show an inline resume flow instead of
  // redirecting to the generic join page, which is confusing for returning members.
  if (member.membership_status !== "active") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/community" className="text-lg font-bold">AstrologyPro</Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Perennial Mandalism</span>
              <PortalLogoutButton />
            </div>
          </div>
        </header>
        <SubscriptionExpiredView
          portalName="Perennial Mandalism"
          portalEmoji="🌙"
          membershipStatus={member.membership_status}
          billingPortalEndpoint="/api/community/billing-portal"
          hasStripeSubscription={!!(member as { stripe_subscription_id?: string | null }).stripe_subscription_id}
          resubscribeHref="/join/community/resubscribe"
        />
      </div>
    );
  }

  // New members who haven't completed onboarding get a minimal layout
  // that client-side redirects to the onboarding wizard (unless already there).
  if (!member.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/community" className="text-lg font-bold">
              AstrologyPro
            </Link>
            <div className="flex items-center gap-2">
              <PortalLogoutButton />
            </div>
          </div>
        </header>
        <SectionContainer as="main" size="narrow" verticalPadding="lg">
          <OnboardingGuard>{children}</OnboardingGuard>
        </SectionContainer>
      </div>
    );
  }

  const portals = await getUserPortals(supabase, user.id);
  const membershipLabel = "Perennial Mandalism";

  const productSubItems = [
    { label: "Product Category", href: "/admin/perennial-content/categories" },
    { label: "Product Management", href: "/admin/perennial-content/products" },
  ];

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
    <div className="min-h-screen bg-background md:flex">
      <RouteTracker href="/community" />

      {/* Left sidebar — desktop only */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-60 md:flex-col md:border-r md:bg-background">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href="/community" className="text-lg font-bold">
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
                  exact={link.href === "/community"}
                  className="block w-full"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavDropdown label="Product" items={productSubItems} />
            </li>
          </ul>
        </nav>
        {/* Logout pinned to sidebar bottom */}
        <div className="border-t px-3 py-3">
          <PortalLogoutButton />
        </div>
      </aside>

      {/* Main column (offset by sidebar width on md+) */}
      <div className="flex min-h-screen w-full flex-col md:ml-60">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav
                membershipType={member.membership_type}
                navItems={navLinks}
                displayName={member.full_name ?? ""}
                membershipLabel={membershipLabel}
              />
              <Link href="/community" className="text-lg font-bold">
                AstrologyPro
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <PortalSwitcher portals={portals} currentBase="/community" />
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
        <SectionContainer as="main" size="fluid" verticalPadding="md">
          {children}
        </SectionContainer>
      </div>
    </div>
  );
}
