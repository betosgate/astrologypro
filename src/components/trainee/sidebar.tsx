"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  MonitorPlay,
  BarChart3,
  ListChecks,
  Library,
  Trophy,
  User,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/trainee", icon: LayoutDashboard },
  { label: "Training", href: "/trainee/training", icon: GraduationCap },
  { label: "Meeting Session", href: "/trainee/sessions", icon: MonitorPlay },
  { label: "Progress", href: "/trainee/progress", icon: BarChart3 },
  { label: "Quiz History", href: "/trainee/quiz-history", icon: ListChecks },
  { label: "Library Resources", href: "/trainee/resources", icon: Library },
  { label: "My Profile", href: "/trainee/profile", icon: User },
];

interface TraineeSidebarProps {
  trainee: {
    name: string;
    username: string | null;
    avatar_url?: string | null;
    graduated_at?: string | null;
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
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
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
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
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
            "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
                    "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    childActive
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ChildIcon
                    className={cn(
                      "size-4 shrink-0",
                      childActive ? "text-amber-500" : ""
                    )}
                  />
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

function isParentActive(item: NavItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some((child) => pathname.startsWith(child.href));
}

export function TraineeSidebar({ trainee }: TraineeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Add Certificate link if graduated
  const items = [...navItems];
  if (trainee.graduated_at) {
    items.splice(6, 0, { label: "Certificate", href: "/trainee/certificate", icon: Trophy });
  }

  useEffect(() => {
    const initialExpanded = new Set<string>();
    for (const item of items) {
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
    if (href === "/trainee") return pathname === "/trainee";
    if (href.startsWith("#")) return false;
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

  const initials = trainee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider>
      <>
        {/* Mobile header bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b px-4 py-3 text-left">
                <SheetTitle className="text-lg font-bold">
                  AstrologyPro
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {items.map((item) => (
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
                    <AvatarImage src={trainee.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">
                      {trainee.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Trainee Portal
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full justify-start text-muted-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <p className="text-sm font-semibold">Trainee Portal</p>
          </div>
          <Avatar className="size-8">
            <AvatarImage src={trainee.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </header>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:border-r lg:bg-background">
          <div className="flex h-14 items-center border-b px-6">
            <Link href="/trainee" className="flex items-center gap-2 text-lg font-bold">
              <span className="text-primary underline decoration-primary/30 underline-offset-4">AstrologyPro</span>
              <span className="text-[10px] uppercase tracking-tighter text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Trainee</span>
            </Link>
          </div>
          <nav className="flex-1 flex flex-col gap-0.5 p-4 overflow-y-auto">
            {items.map((item) => (
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
          <div className="border-t p-4 bg-muted/20">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 ring-2 ring-primary/10">
                <AvatarImage src={trainee.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/5 text-primary-foreground/80">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold truncate leading-tight">
                  {trainee.name}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  Active Trainee
                </p>
              </div>
            </div>
            <Link
              href="/trainee/profile"
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="size-3.5" />
              Settings & Profile
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start text-muted-foreground text-xs hover:text-destructive hover:bg-destructive/5"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-3.5" />
              Log out
            </Button>
          </div>
        </aside>
      </>
    </TooltipProvider>
  );
}
