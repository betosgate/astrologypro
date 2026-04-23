"use client";

// Nav + avatar header for the /affiliate/* portal. Client-only for nav-active
// highlighting; account data is passed in from the server layout.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  Link as LinkIcon,
  Megaphone,
  Users,
  UserCircle,
  Handshake,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { SectionContainer } from "@/components/shared/section-container";

const navItems = [
  { href: "/affiliate", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/affiliate/partnerships", label: "Partnerships", icon: Users },
  { href: "/affiliate/earnings", label: "Earnings", icon: DollarSign },
  { href: "/affiliate/commissions", label: "Commissions", icon: DollarSign },
  { href: "/affiliate/links", label: "Links", icon: LinkIcon },
  { href: "/affiliate/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/affiliate/profile", label: "Profile", icon: UserCircle },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AffiliateHeader({
  accountName,
  accountEmail,
  avatarUrl,
}: {
  accountName: string;
  accountEmail: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  return (
    <header className="border-b bg-card">
      <SectionContainer className="flex items-center justify-between gap-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/affiliate" className="inline-flex items-center gap-2">
            <Handshake className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold tracking-tight">
              Affiliate Portal
            </span>
          </Link>
          <nav aria-label="Affiliate navigation" className="hidden gap-1 sm:flex">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-right sm:flex">
            <div className="leading-tight">
              <p className="text-sm font-medium">{accountName}</p>
              <p className="text-xs text-muted-foreground">{accountEmail}</p>
            </div>
            <Avatar className="size-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback>{initials(accountName)}</AvatarFallback>
            </Avatar>
          </div>
          <PortalLogoutButton />
        </div>
      </SectionContainer>
    </header>
  );
}
