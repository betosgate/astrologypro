"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  iconNode?: React.ReactNode;
}

interface MobileNavProps {
  membershipType: string;
  navItems: NavItem[];
  displayName: string;
  avatarUrl?: string | null;
  memberHandle: string;
  membershipLabel: string;
}

export function MobileNav({
  navItems,
  displayName,
  avatarUrl,
  memberHandle,
  membershipLabel,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const initials = displayName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

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
          <p className="text-left text-[10px] font-semibold uppercase tracking-widest text-primary">
            {membershipLabel}
          </p>
        </SheetHeader>
        <nav className="flex flex-col py-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              <div className="text-muted-foreground [&>svg]:size-4">
                {item.iconNode}
              </div>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 space-y-2 border-t bg-background p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{memberHandle}
              </p>
            </div>
          </div>
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
