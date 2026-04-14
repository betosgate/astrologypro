"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Users,
  Users2,
  Sparkles,
  User,
  UserCheck,
  Settings,
  Menu,
  LogOut,
  MessageSquare,
  Radio,
  Megaphone,
  BarChart3,
  BarChart2,
  Gift,
  Tag,
  Mail,
  ClipboardList,
  ListChecks,
  Receipt,
  CreditCard,
  Wallet,
  Video,
  MonitorPlay,
  Library,
  Image,
  Flame,
  LifeBuoy,
  Globe,
  Rss,
  Target,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Calendar",
    href: "#calendar-group",
    icon: CalendarDays,
    children: [
      { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
      { label: "Availability", href: "/dashboard/availability", icon: CalendarDays },
      { label: "Calendar View", href: "/dashboard/calendar", icon: CalendarCheck },
    ],
  },
  { label: "Orders", href: "/dashboard/orders", icon: Receipt },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Check-Ins", href: "/dashboard/check-ins", icon: UserCheck },
  {
    label: "Sessions",
    href: "#sessions-group",
    icon: Video,
    children: [
      { label: "Live", href: "/dashboard/live", icon: Radio },
      { label: "Video Sessions", href: "/dashboard/video", icon: MonitorPlay },
      { label: "Session Library", href: "/dashboard/library", icon: Library },
    ],
  },
  { label: "Services", href: "/dashboard/services", icon: Sparkles },
  { label: "Media Gallery", href: "/dashboard/media", icon: Image },
  { label: "My Rituals", href: "/dashboard/rituals", icon: Flame },
  { label: "Mundane Astrology", href: "/dashboard/mundane", icon: Globe },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: Rss },
  { label: "Intake Builder", href: "/dashboard/intake-builder", icon: ListChecks },
  { label: "Discounts", href: "/dashboard/discounts", icon: Tag },
  { label: "Gift Certificates", href: "/dashboard/gift-certificates", icon: Gift },
  {
    label: "Marketing",
    href: "#marketing-group",
    icon: Megaphone,
    children: [
      { label: "Marketing Hub", href: "/dashboard/marketing", icon: Megaphone },
      { label: "Campaigns", href: "/dashboard/campaigns", icon: Target },
      { label: "Campaign Reports", href: "/dashboard/campaigns/reports", icon: BarChart2 },
      { label: "Affiliates", href: "/dashboard/affiliates", icon: Users2 },
      { label: "Giveaways", href: "/dashboard/giveaways", icon: Trophy },
      { label: "Follow-ups", href: "/dashboard/follow-ups", icon: Mail },
    ],
  },
  {
    label: "Insights",
    href: "#insights-group",
    icon: BarChart3,
    children: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Reading Reports", href: "/dashboard/reports/readings", icon: BarChart2 },
    ],
  },
  { label: "Testimonials", href: "/dashboard/testimonials", icon: MessageSquare },
  {
    label: "Finance",
    href: "#finance-group",
    icon: Wallet,
    children: [
      { label: "Finance", href: "/dashboard/finance", icon: Wallet },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
    ],
  },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
];

interface SidebarProps {
  diviner: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

function NavLink({
  item,
  isActive,
  collapsed,
  isExpanded,
  onToggle,
  isActiveCheck,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  isActiveCheck?: (href: string) => boolean;
}) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {hasChildren ? (
            <button
              onClick={onToggle}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="sr-only">{item.label}</span>
            </button>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="size-5" />
          {item.label}
          <ChevronDown
            className={cn(
              "ml-auto size-4 transition-transform duration-200",
              isExpanded ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
        {isExpanded && (
          <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l pl-3">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isActiveCheck ? isActiveCheck(child.href) : false;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    childActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ChildIcon className="size-4" />
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-5" />
      {item.label}
    </Link>
  );
}

/** Check if any child of a nav item is currently active */
function isParentActive(item: NavItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some((child) => pathname.startsWith(child.href));
}

export function Sidebar({ diviner }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track which parent menus are expanded (by label)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Default-expand any parent whose child is currently active
  useEffect(() => {
    const initialExpanded = new Set<string>();
    for (const item of navItems) {
      if (item.children && isParentActive(item, pathname)) {
        initialExpanded.add(item.label);
      }
    }
    if (initialExpanded.size > 0) {
      setExpandedMenus((prev) => new Set([...prev, ...initialExpanded]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMenu(label: string) {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.startsWith("#")) return false; // parent group placeholder
    return pathname.startsWith(href);
  };

  const isItemActive = (item: NavItem) => {
    if (item.children) return isParentActive(item, pathname);
    return isActive(item.href);
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = diviner.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = getDivinerAvatarUrl(diviner.avatar_url);

  return (
    <>
      {/* Mobile header bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="text-lg font-bold">
                AstrologyPro
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <div key={item.label} onClick={() => { if (!item.children) setMobileOpen(false); }}>
                  <NavLink
                    item={item}
                    isActive={isItemActive(item)}
                    isExpanded={expandedMenus.has(item.label)}
                    onToggle={() => toggleMenu(item.label)}
                    isActiveCheck={isActive}
                  />
                </div>
              ))}
            </nav>
            <div className="mt-auto border-t p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">
                    {diviner.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{diviner.username}
                  </p>
                </div>
              </div>
              <Link
                href="/account"
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <User className="size-4" />
                My Account
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full justify-start text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 size-4" />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1">
          <p className="text-sm font-semibold">AstrologyPro</p>
        </div>
        <Avatar className="size-8">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:border-r lg:bg-background">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold">
            AstrologyPro
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              isActive={isItemActive(item)}
              isExpanded={expandedMenus.has(item.label)}
              onToggle={() => toggleMenu(item.label)}
              isActiveCheck={isActive}
            />
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">
                {diviner.display_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{diviner.username}
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <User className="size-4" />
            My Account
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
