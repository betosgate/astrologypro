"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function PendingPoller() {
  const params = useSearchParams();
  const session = params.get("session");

  useEffect(() => {
    if (!session) return;
    const id = setInterval(async () => {
      // The confirm route redirects to /gift/{code} when the webhook has fired.
      // fetch follows redirects — check if we landed on a gift page.
      const res = await fetch(`/api/gift/confirm?session_id=${session}`);
      if (res.redirected && res.url.includes("/gift/") && !res.url.includes("/pending")) {
        window.location.href = res.url;
      }
    }, 2000);
    return () => clearInterval(id);
  }, [session]);

  return null;
}

export default function GiftPendingPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="size-10 animate-spin text-violet-600" />
      <h1 className="text-2xl font-bold">Processing your gift…</h1>
      <p className="max-w-sm text-muted-foreground">
        Payment confirmed! We&rsquo;re setting up your gift certificate. This
        usually takes just a few seconds.
      </p>
      <Suspense>
        <PendingPoller />
      </Suspense>
    </section>
  );
}
