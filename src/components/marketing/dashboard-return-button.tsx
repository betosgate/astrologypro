"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

async function resolveDestination(): Promise<string> {
  try {
    const res = await fetch("/api/auth/post-login-redirect");
    if (res.ok) {
      const { destination } = await res.json();
      if (destination) return destination;
    }
  } catch {
    // ignore
  }
  return "/dashboard";
}

/**
 * Shown in the marketing header when the user already has an active session.
 * Resolves their correct dashboard via the server and navigates there on click.
 */
export function DashboardReturnButton() {
  const [show, setShow] = useState(false);
  const [destination, setDestination] = useState("/dashboard");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const dest = await resolveDestination();
        setDestination(dest);
        setShow(true);
      }
    });
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => router.push(destination)}
      title="My Dashboard"
      className="flex size-9 items-center justify-center rounded-sm transition-all hover:brightness-110"
      style={{
        background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
        color: "#1a0f00",
      }}
    >
      <LayoutDashboard className="size-[18px]" />
    </button>
  );
}
