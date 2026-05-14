import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";
import { RouteTracker } from "@/components/shared/route-tracker";
import { MobileNav } from "@/components/community/mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLink } from "@/components/shared/nav-link";
import { NavDropdown } from "@/components/shared/nav-dropdown";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { OnboardingGuard } from "@/components/community/onboarding-guard";
import { SectionContainer } from "@/components/shared/section-container";
import { SubscriptionExpiredView } from "@/components/shared/subscription-expired-view";
import { getPendingContractDestination } from "@/lib/contract-orchestration";
import {
  LayoutDashboard, Video, Radio, Calendar, BookOpen,
  ClipboardList, Users, Star, TrendingUp, Flame, Sparkles, 
  Globe, Compass, Telescope, HeartHandshake, BookMarked,
  Package, IdCard, UserCog, Tags, Settings2, LifeBuoy
} from "lucide-react";

export const metadata = { title: "Community - AstrologyPro" };
export const dynamic = "force-dynamic";

function slugifyHandlePart(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCommunityHandle(name: string, memberId: string) {
  const base = slugifyHandlePart(name) || "community-member";
  const suffix = memberId.replace(/-/g, "").slice(0, 6).toLowerCase();

  return suffix ? `${base}-${suffix}` : base;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((namePart) => namePart[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

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
    .maybeSingle();


  console.log("[CommunityLayout] user.id =", user.id, "onboarding_completed =", member?.onboarding_completed);



  if (!member) {
    const invitedRole = user.user_metadata?.role;
    if (
      user.user_metadata?.invited_by_admin === true &&
      (invitedRole === "community_perennial_mandalism" ||
        invitedRole === "perennial_mandalism")
    ) {
      redirect("/join/community/plan?invited=true");
    }
    redirect("/get-started");
  }
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
  const displayName =
    member.full_name?.trim() ||
    member.first_name?.trim() ||
    user.email?.split("@")[0] ||
    "Community Member";
  const rawAvatarUrl = user.user_metadata?.avatar_url;
  const avatarUrl =
    typeof rawAvatarUrl === "string" && rawAvatarUrl.trim() !== ""
      ? rawAvatarUrl
      : null;
  const memberHandle = getCommunityHandle(displayName, member.id);
  const initials = getInitials(displayName);

  const productSubItems = [
    // { label: "Product Category", href: "/admin/perennial-content/categories", icon: <Tags className="size-4" /> },
    // { label: "Product Management", href: "/admin/perennial-content/products", icon: <Settings2 className="size-4" /> },
  ];

  const navLinks = [
    { label: "Home", href: "/community", iconNode: <LayoutDashboard className="size-4" /> },
    { label: "Sessions", href: "/community/sessions", iconNode: <Video className="size-4" /> },
    // { label: "Broadcasts", href: "/community/broadcasts", iconNode: <Radio className="size-4" /> },
    { label: "Events", href: "/community/events", iconNode: <Calendar className="size-4" /> },
    { label: "Resources", href: "/community/resources", iconNode: <BookOpen className="size-4" /> },
    { label: "My Plan", href: "/community/plan", iconNode: <ClipboardList className="size-4" /> },
    { label: "Nativity Charts", href: "/community/family", iconNode: <Users className="size-4" /> },
    { label: "Relationship Charts", href: "/community/charts", iconNode: <Star className="size-4" /> },
    { label: "Monthly Transits", href: "/community/transits", iconNode: <TrendingUp className="size-4" /> },
    { label: "Rituals", href: "/community/rituals", iconNode: <Flame className="size-4" /> },
    // { label: "Tarot", href: "/community/tarot", iconNode: <Sparkles className="size-4" /> },
    { label: "Mundane", href: "/community/mundane", iconNode: <Globe className="size-4" /> },
    { label: "Ingress Charts", href: "/community/ingress-charts", iconNode: <Compass className="size-4" /> },
    // { label: "Horoscope", href: "/community/horoscope", iconNode: <Telescope className="size-4" /> },
    // { label: "Service", href: "/community/sunday-service", iconNode: <HeartHandshake className="size-4" /> },
    { label: "Library", href: "/community/library", iconNode: <BookMarked className="size-4" /> },
    { label: "Support", href: "/community/support", iconNode: <LifeBuoy className="size-4" /> },
    { label: "Profile", href: "/community/profile", iconNode: <IdCard className="size-4" /> },
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
                  className="w-full"
                >
                  {link.iconNode}
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
            {/* <li>
              <NavDropdown
                label="Product"
                items={productSubItems}
                icon={<Package className="size-4" />}
              />
            </li> */}
          </ul>
        </nav>
        {/* Account and Logout pinned to sidebar bottom */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{memberHandle}
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <UserCog className="size-4" />
            My Account
          </Link>
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
                displayName={displayName}
                avatarUrl={avatarUrl}
                memberHandle={memberHandle}
                membershipLabel={membershipLabel}
              />
              <Link href="/community" className="text-lg font-bold">
                AstrologyPro
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <PortalSwitcher portals={portals} currentBase="/community" />
              <NotificationBell userId={user.id} />
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
