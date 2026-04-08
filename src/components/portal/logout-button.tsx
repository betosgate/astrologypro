"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export { PortalLogoutButton as SignOutButton };

type PortalLogoutButtonProps = {
  className?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "default";
  onLoggedOut?: () => void;
  children?: ReactNode;
};

export function PortalLogoutButton({
  className,
  variant = "ghost",
  size = "sm",
  onLoggedOut,
  children = "Log out",
}: PortalLogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out:", error.message);
      return;
    }
    onLoggedOut?.();
    router.refresh();
    router.push("/login");
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("text-muted-foreground", className)}
      onClick={handleLogout}
    >
      <LogOut className="mr-2 size-4" />
      {children}
    </Button>
  );
}
