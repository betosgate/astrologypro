"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, DollarSign, Link as LinkIcon, Megaphone } from "lucide-react";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { SectionContainer } from "@/components/shared/section-container";

const navItems = [
  { href: "/affiliate/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/affiliate/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/affiliate/links", label: "My Links", icon: LinkIcon },
  { href: "/affiliate/commissions", label: "Commissions", icon: DollarSign },
];

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Note: auth check happens in each server component page.
  // Layout stays client-only for nav rendering.

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <header className="border-b bg-card">
        <SectionContainer className="flex items-center justify-between gap-6 py-3">
          <div className="flex items-center gap-6">
          <span className="font-semibold text-sm tracking-tight">Affiliate Portal</span>
          <nav className="flex gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
          </div>
          <PortalLogoutButton />
        </SectionContainer>
      </header>

      <SectionContainer as="main" verticalPadding="lg">
        {children}
      </SectionContainer>
    </div>
  );
}
