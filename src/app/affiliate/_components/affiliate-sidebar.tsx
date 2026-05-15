"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  DollarSign,
  History,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  UserCircle,
  Users,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PortalLogoutButton } from "@/components/portal/logout-button";

type NavItemDef = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: { label: string; href: string; icon: React.ElementType }[];
};

type NavGroupDef = {
  label: string;
  items: NavItemDef[];
};

const NAV_GROUPS: NavGroupDef[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/affiliate",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Partnerships",
    items: [
      { label: "Partnerships", href: "/affiliate/partnerships", icon: Users },
      { label: "Products", href: "/affiliate/products", icon: Package },
      { label: "Campaigns", href: "/affiliate/campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Earnings", href: "/affiliate/earnings", icon: DollarSign },
      { label: "History", href: "/affiliate/history", icon: History },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/affiliate/notifications", icon: Bell },
      { label: "Profile", href: "/affiliate/profile", icon: UserCircle },
    ],
  },
];

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
        className={cn("size-4 shrink-0", isActive ? "text-amber-500" : "")}
      />
      {item.label}
    </Link>
  );
}

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
        onClick={() => setOpen((value) => !value)}
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

function NavGroup({
  group,
  pathname,
  onClick,
}: {
  group: NavGroupDef;
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
        onClick={() => setOpen((value) => !value)}
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
                item={
                  item as NavItemDef & {
                    children: NonNullable<NavItemDef["children"]>;
                  }
                }
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
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
            Affiliate
          </span>
        </div>
      </div>

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

      <div className="shrink-0 space-y-1 border-t p-3">
        <Link
          href="/affiliate/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <UserCircle className="size-4" />
          Profile
        </Link>
        <PortalLogoutButton
          className="w-full justify-start px-3"
          onLoggedOut={onNavigate}
        />
      </div>
    </div>
  );
}

export function AffiliateSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden max-[768px]:h-auto max-[768px]:flex-wrap max-[768px]:justify-start max-[768px]:pb-[10px]">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Affiliate navigation</SheetTitle>
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
          Affiliate
        </span>
      </header>

      <aside className="hidden border-r bg-background lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
