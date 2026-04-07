"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  User,
  Settings,
  Menu,
  LogOut,
  MessageSquare,
  Radio,
  Users2,
  Megaphone,
  BarChart3,
  BarChart2,
  CalendarDays,
  LayoutGrid,
  Gift,
  Tag,
  Mail,
  ClipboardList,
  CreditCard,
  Video,
  LifeBuoy,
  Globe,
  Play,
  Rss,
  UserCheck,
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
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
  { label: "Schedule", href: "/dashboard/schedule", icon: LayoutGrid },
  { label: "Availability", href: "/dashboard/availability", icon: CalendarDays },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Check-Ins", href: "/dashboard/check-ins", icon: UserCheck },
  { label: "Giveaways", href: "/dashboard/giveaways", icon: Gift },
  { label: "Testimonials", href: "/dashboard/testimonials", icon: MessageSquare },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Affiliates", href: "/dashboard/affiliates", icon: Users2 },
  { label: "Live", href: "/dashboard/live", icon: Radio },
  { label: "Video Sessions", href: "/dashboard/video", icon: Video },
  { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
  { label: "Reading Reports", href: "/dashboard/reports/readings", icon: BarChart2 },
  { label: "Mundane Astrology", href: "/dashboard/mundane", icon: Globe },
  { label: "Services", href: "/dashboard/services", icon: Sparkles },
  { label: "Media Gallery", href: "/dashboard/media", icon: Play },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: Rss },
  { label: "My Rituals", href: "/dashboard/rituals", icon: Play },
  { label: "Gift Certificates", href: "/dashboard/gift-certificates", icon: Gift },
  { label: "Discounts", href: "/dashboard/discounts", icon: Tag },
  { label: "Follow-ups", href: "/dashboard/follow-ups", icon: Mail },
  { label: "Intake Builder", href: "/dashboard/intake-builder", icon: ClipboardList },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
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
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
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

export function Sidebar({ diviner }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
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
                <div key={item.href} onClick={() => setMobileOpen(false)}>
                  <NavLink item={item} isActive={isActive(item.href)} />
                </div>
              ))}
            </nav>
            <div className="mt-auto border-t p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={diviner.avatar_url ?? undefined} />
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
          <AvatarImage src={diviner.avatar_url ?? undefined} />
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
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={diviner.avatar_url ?? undefined} />
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
