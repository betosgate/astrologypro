"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href: string;
}

interface MobileNavProps {
  membershipType: string;
  navItems: NavItem[];
  displayName: string;
  membershipLabel: string;
}

export function MobileNav({
  navItems,
  displayName,
  membershipLabel,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {displayName?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
                {membershipLabel}
              </Badge>
            </div>
          </div>
        </SheetHeader>
        <nav className="flex flex-col py-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background space-y-2">
          <Link
            href="/account"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          <PortalLogoutButton
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onLoggedOut={() => setOpen(false)}
          >
            Sign Out
          </PortalLogoutButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
