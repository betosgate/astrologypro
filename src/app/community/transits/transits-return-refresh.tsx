"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageReturnRefresh } from "@/hooks/use-page-return-refresh";

export function TransitsReturnRefresh() {
  const router = useRouter();

  const refreshTransits = useCallback(() => {
    router.refresh();
  }, [router]);

  usePageReturnRefresh(refreshTransits, { minIntervalMs: 1500 });

  return null;
}
