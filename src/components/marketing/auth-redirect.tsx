"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
 * Invisible component — if the user already has a session, redirects them
 * to their correct dashboard immediately. Renders nothing in the DOM.
 * Used on marketing pages (home, login) so logged-in users never get stuck.
 */
export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const dest = await resolveDestination();
        router.replace(dest);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
