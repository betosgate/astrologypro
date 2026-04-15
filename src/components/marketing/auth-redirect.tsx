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
 * Invisible component — redirects users to their dashboard only when they
 * actively sign in via the Supabase implicit flow (i.e. Supabase lands them
 * here with #access_token in the URL hash after a successful login).
 *
 * Intentionally does NOT redirect already-logged-in visitors so they can
 * browse the marketing homepage freely.
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

    // Only redirect on an active SIGNED_IN event (implicit OAuth / magic-link
    // flow). Existing sessions on return visits are intentionally ignored so
    // logged-in users can stay on the marketing page.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
