"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/admin/global-search";
import {
  LayoutDashboard,
  Users,
  Shield,
  Share2,
  FileText,
  Video,
  Monitor,
  Sparkles,
  Layers,
  Leaf,
  CircleDot,
  CalendarDays,
  Navigation,
  BookOpen,
  Film,
  Grid2X2,
  Eye,
  Hexagon,
  Sun,
  Package,
  CreditCard,
  RefreshCcw,
  ShoppingBag,
  BarChart3,
  BarChart2,
  Radio,
  ClipboardList,
  Shuffle,
  Flame,
  Settings2,
  Database,
  TrendingUp,
  GraduationCap,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Star,
  Globe,
  Building2,
  MailCheck,
  History,
  FileCode2,
  Mail,
  Gift,
  ScrollText,
  ListChecks,
  MessageSquare,
  MousePointerClick,
  UserCog,
  Clock,
  FlaskConical,
  Search,
  Orbit,
  MapPin,
  UserX,
  BookOpenCheck,
  ScrollTextIcon,
  Map,
  Key,
} from "lucide-react";

// ─── Nav structure ─────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Walkthrough", href: "/walkthrough", icon: Map },
      { label: "Analytics", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Diviners", href: "/admin/diviners", icon: Star },
      { label: "Affiliates", href: "/admin/affiliates", icon: Users },
      { label: "Roles", href: "/admin/roles", icon: Shield },
      { label: "Invitations", href: "/admin/invitations", icon: Mail },
      { label: "Social Advocacy", href: "/admin/social-advocacy", icon: Share2 },
      { label: "Deleted Users", href: "/admin/users/deleted", icon: UserX },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blog Posts", href: "/admin/blog", icon: FileText, exact: true },
      { label: "Blog Analytics", href: "/admin/blog/analytics", icon: BarChart2 },
      { label: "Blog CTA Blocks", href: "/admin/blog/cta-blocks", icon: MousePointerClick },
      { label: "Blog Categories", href: "/admin/blog/categories", icon: Layers },
      { label: "Blog Authors", href: "/admin/blog/authors", icon: Users },
      { label: "Blog Series", href: "/admin/blog/series", icon: BookOpen },
      { label: "Media Items", href: "/admin/media-items", icon: Film },
      { label: "Videos", href: "/admin/videos", icon: Video },
      { label: "Video Sessions", href: "/admin/video-sessions", icon: Video },
      { label: "Webinars", href: "/admin/webinars", icon: Monitor },
      { label: "Spiritual Wisdom", href: "/admin/spiritual-wisdom", icon: Sparkles },
      { label: "General Content", href: "/admin/general-content", icon: Layers },
      { label: "Perennial Content", href: "/admin/perennial-content", icon: Leaf, exact: true },
      {
        label: "Products",
        href: "/admin/perennial-content/products",
        icon: Package,
        children: [
          { label: "Product Categories", href: "/admin/perennial-content/categories", icon: Layers },
          { label: "Product Management", href: "/admin/perennial-content/products", icon: ShoppingBag },
        ],
      },
    ],
  },
  {
    label: "Astrology",
    items: [
      { label: "Wheel Signs", href: "/admin/wheel-signs", icon: CircleDot },
      { label: "Mundane Hub", href: "/admin/mundane-dashboard", icon: Globe },
      { label: "Mundane", href: "/admin/mundane", icon: Globe },
      { label: "Ingress Charts", href: "/admin/ingress-charts", icon: Navigation },
      { label: "Entities", href: "/admin/mundane-entities", icon: Building2 },
      { label: "Forecasts", href: "/admin/mundane-forecasts", icon: TrendingUp },
      { label: "Event Calendar", href: "/admin/mundane/event-calendar", icon: CalendarDays },
      { label: "Chart Studio", href: "/admin/mundane/chart-studio", icon: Orbit },
      { label: "World Map", href: "/admin/mundane/world-map", icon: MapPin },
      { label: "Research", href: "/admin/mundane/research", icon: FlaskConical },
      { label: "Mundane Search", href: "/admin/mundane/search", icon: Search },
      { label: "Mundane Access", href: "/admin/mundane-access", icon: Shield },
      { label: "Decan Journals", href: "/admin/decan-journals", icon: BookOpen },
      { label: "Decan Media", href: "/admin/decan-media", icon: Film },
      { label: "Quarters", href: "/admin/quarters", icon: Grid2X2 },
      { label: "Horoscope Toolkit", href: "/admin/horoscope", icon: Star },
    ],
  },
  {
    label: "Programs",
    items: [
      { label: "Mystery School", href: "/admin/mystery-school", icon: Eye, exact: true },
      { label: "MS Students", href: "/admin/mystery-school/students", icon: Users },
      { label: "MS Decans", href: "/admin/mystery-school/decans", icon: BookOpenCheck },
      { label: "MS Journals", href: "/admin/mystery-school/journals", icon: ScrollTextIcon },
      { label: "Mandalism", href: "/admin/mandalism", icon: Hexagon },
      { label: "Sunday Service", href: "/admin/sunday-service", icon: Sun },
    ],
  },
  {
    label: "Live",
    items: [
      { label: "Live Sessions", href: "/admin/live-sessions", icon: Radio },
      { label: "Check-ins", href: "/admin/check-ins", icon: ClipboardList },
    ],
  },
  {
    label: "My Schedule",
    items: [
      { label: "My Schedule", href: "/admin/my-schedule", icon: UserCog },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
      { label: "My Availability", href: "/admin/availability", icon: ClipboardList },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "PM Plan Tiers", href: "/admin/pm-plan-tiers", icon: Layers },
      { label: "Broadcasts", href: "/admin/broadcasting", icon: Radio },
      { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
      { label: "Holy Books", href: "/admin/holy-books", icon: BookOpen },
      { label: "Doctrine Links", href: "/admin/doctrine-links", icon: Star },
    ],
  },
  {
    label: "Training",
    items: [
      { label: "Programs & Lessons", href: "/admin/training", icon: GraduationCap, exact: true },
      { label: "Analytics", href: "/admin/training/analytics", icon: TrendingUp },
      { label: "Settings", href: "/admin/training/settings", icon: Settings2 },
      { label: "Class Config", href: "/admin/class-config", icon: LayoutDashboard },
    ],
  },
  {
    label: "Plans",
    items: [
      { label: "Diviner Plans", href: "/admin/diviner-plans", icon: Layers },
      { label: "Service Config", href: "/admin/service-config", icon: Settings2 },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Packages", href: "/admin/packages", icon: Package },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Refunds", href: "/admin/refunds", icon: RefreshCcw },
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Activity Log", href: "/admin/reports/activity", icon: ListChecks },
    ],
  },
  {
    label: "Email",
    items: [
      { label: "Email Sequences", href: "/admin/email-sequences", icon: MailCheck },
      { label: "Email History", href: "/admin/email-history", icon: History },
      { label: "Email Preview", href: "/admin/email-preview", icon: FileCode2 },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Giveaways", href: "/admin/giveaways", icon: Gift },
    ],
  },
  {
    label: "Manage Testimonial",
    items: [
      { label: "Testimonials List", href: "/admin/testimonials", icon: MessageSquare, exact: true },
      { label: "Request Testimonial", href: "/admin/testimonials/requests", icon: ScrollText },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Tarot Spreads", href: "/admin/tarot/spreads", icon: Shuffle },
      { label: "Tarot Cards", href: "/admin/tarot/cards", icon: LayoutGrid },
      { label: "Rituals", href: "/admin/rituals", icon: Flame },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Readings", href: "/admin/reports/readings", icon: BarChart2 },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Tickets", href: "/admin/tickets", icon: MessageSquare, exact: true },
      { label: "SLA Dashboard", href: "/admin/tickets/sla", icon: Clock },
      { label: "Queue Config", href: "/admin/tickets/queues", icon: ListChecks },
    ],
  },
  {
    label: "Config",
    items: [
      { label: "Platform Settings", href: "/admin/platform-settings", icon: Settings2 },
      { label: "API Keys", href: "/admin/astrology-keys", icon: Key },
      { label: "Astro System Settings", href: "/admin/astro-system-settings", icon: Key },
      { label: "Calendar Config", href: "/admin/calendar-config", icon: CalendarDays },
      { label: "Pricing Management", href: "/admin/pricing", icon: CreditCard },
      { label: "Legal", href: "/admin/legal", icon: ScrollText },
      { label: "DB Migrations", href: "/admin/db/migrations", icon: Database },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItemDef = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: { label: string; href: string; icon: React.ElementType }[];
};

// ─── Single nav item ────────────────────────────────────────────────────────────

function isItemActive(
  item: { href: string; exact?: boolean },
  pathname: string
) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          isActive ? "text-amber-500" : ""
        )}
      />
      {item.label}
    </Link>
  );
}

// ─── Nav item with children (dropdown) ────────────────────────────────────────

function NavItemWithChildren({
  item,
  pathname,
  onClick,
}: {
  item: NavItemDef & { children: NonNullable<NavItemDef["children"]> };
  pathname: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const childActive = item.children.some((child) =>
    isItemActive(child, pathname)
  );
  const [open, setOpen] = useState(childActive);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          childActive
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            childActive ? "text-amber-500" : ""
          )}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-5">
          {item.children.map((child) => (
            <NavItem
              key={child.href}
              item={child}
              isActive={isItemActive(child, pathname)}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible group ──────────────────────────────────────────────────────────

function NavGroup({
  group,
  pathname,
  onClick,
}: {
  group: (typeof NAV_GROUPS)[number];
  pathname: string;
  onClick?: () => void;
}) {
  const hasActive = group.items.some((item) => {
    if (isItemActive(item, pathname)) return true;
    if ("children" in item && item.children) {
      return item.children.some((child) => isItemActive(child, pathname));
    }
    return false;
  });

  const [open, setOpen] = useState(hasActive || group.label === "Overview");

  // "Overview" group — no collapse header, always show
  if (group.label === "Overview") {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isItemActive(item, pathname)}
            onClick={onClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
          hasActive
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {group.label}
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {group.items.map((item) =>
            "children" in item && item.children ? (
              <NavItemWithChildren
                key={item.href}
                item={item as NavItemDef & { children: NonNullable<NavItemDef["children"]> }}
                pathname={pathname}
                onClick={onClick}
              />
            ) : (
              <NavItem
                key={item.href}
                item={item}
                isActive={isItemActive(item, pathname)}
                onClick={onClick}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar content (shared between desktop and mobile sheet) ──────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b px-4 gap-2.5">
        <Image
          src="/images/home/png_logo_1.png"
          alt="AstrologyPro"
          width={32}
          height={32}
          className="rounded object-contain"
          style={{ height: "auto" }}
        />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">AstrologyPro</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
            Admin
          </span>
        </div>
      </div>

      {/* Global search */}
      <div className="shrink-0 border-b px-3 py-2">
        <GlobalSearch />
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-3 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1 border-t p-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LayoutGrid className="size-4" />
          Diviner Dashboard
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground px-3"
          onClick={handleLogout}
        >
          <LogOut className="mr-2.5 size-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

// ─── Exported sidebar ───────────────────────────────────────────────────────────

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Image
          src="/images/home/png_logo_1.png"
          alt="AstrologyPro"
          width={24}
          height={24}
          className="rounded object-contain"
          style={{ height: "auto" }}
        />
        <span className="text-sm font-bold">AstrologyPro</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
          Admin
        </span>
        <div className="ml-auto">
          <GlobalSearch />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col border-r bg-background">
        <SidebarContent />
      </aside>
    </>
  );
}
