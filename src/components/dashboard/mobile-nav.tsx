"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  Menu,
  User,
  Settings,
  MessageSquare,
  Radio,
  Users2,
  Megaphone,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryNavItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Services", href: "/dashboard/services", icon: Sparkles },
];

const moreNavItems = [
  { label: "Schedule", href: "/dashboard/schedule", icon: LayoutGrid },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Testimonials", href: "/dashboard/testimonials", icon: MessageSquare },
  { label: "Affiliates", href: "/dashboard/affiliates", icon: Users2 },
  { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
  { label: "Live", href: "/dashboard/live", icon: Radio },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isMoreActive = moreNavItems.some((item) => isActive(item.href));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <nav className="flex h-16 items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                isMoreActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Menu className="size-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <nav className="grid grid-cols-3 gap-2 px-4 pb-6">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg p-3 text-xs transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
