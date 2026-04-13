"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Client-side guard that redirects to /community/onboarding when the member
 * hasn't completed their profile. Rendered by the community layout only when
 * onboarding_completed is false. If the user is already on the onboarding page, the
 * guard is a no-op and just renders children.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith("/community/onboarding")) {
      router.replace("/community/onboarding");
    }
  }, [pathname, router]);

  // Always render children so the onboarding page itself works
  return <>{children}</>;
}
