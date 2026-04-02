"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function PortalLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 size-4" />
      Log out
    </Button>
  );
}
