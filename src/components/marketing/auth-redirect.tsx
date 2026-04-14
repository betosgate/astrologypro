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
 * Invisible component — redirects logged-in users to their dashboard.
 *
 * Handles two cases:
 * 1. User already has a session (returning visit) — getSession() catches it
 * 2. Supabase implicit flow lands user here with #access_token in the hash —
 *    onAuthStateChange fires once the client parses the fragment and sets the session
 */
export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let redirected = false;

    async function go() {
      if (redirected) return;
      redirected = true;
      const dest = await resolveDestination();
      router.replace(dest);
    }

    // Case 1: session already exists (e.g. returning visitor)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go();
    });

    // Case 2: implicit flow — #access_token in URL hash, client parses async
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
