"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ProfileGuard({
  isComplete,
  children,
}: {
  isComplete: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isComplete && pathname !== "/community/profile/complete") {
      router.replace("/community/profile/complete");
    }
  }, [isComplete, pathname, router]);

  // If incomplete and trying to render another page, strictly block rendering
  // to avoid flash of content before useEffect redirects.
  if (!isComplete && pathname !== "/community/profile/complete") {
    return null;
  }

  return <>{children}</>;
}
