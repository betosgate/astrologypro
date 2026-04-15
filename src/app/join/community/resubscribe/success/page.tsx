"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, RefreshCcw } from "lucide-react";

/**
 * /join/community/resubscribe/success
 *
 * Polling page for returning PM members after Stripe checkout.
 * Polls /api/community/subscription until membership_status = 'active',
 * then redirects to /community.
 *
 * Lives outside the /community layout so it is NOT blocked by the
 * active-status guard.
 */

type PollState = "polling" | "success" | "failed";

export default function ResubscribeSuccessPage() {
  const router = useRouter();
  const [state, setState] = useState<PollState>("polling");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (let attempt = 0; attempt < 15; attempt++) {
        if (cancelled) return;

        try {
          const res = await fetch("/api/community/subscription");
          const data = await res.json();

          if (
            data?.subscription?.membership_status === "active" ||
            data?.membership_status === "active"
          ) {
            if (!cancelled) {
              setState("success");
              setTimeout(() => router.replace("/community"), 1000);
            }
            return;
          }
        } catch {
          // ignore fetch errors, keep polling
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!cancelled) setState("failed");
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {state === "success" && (
          <Card className="w-full max-w-md border-primary/30 bg-primary/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Your Perennial Mandalism membership is active again.
                Redirecting to your dashboard...
              </p>
            </CardContent>
          </Card>
        )}

        {state === "failed" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Almost There</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your payment was successful but your membership is still
                activating. This usually takes a few seconds — please try
                refreshing.
              </p>
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCcw className="size-4" /> Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {state === "polling" && (
          <Card className="w-full max-w-md border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
              <CardTitle className="text-2xl">Activating Your Membership</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Your payment was confirmed. We are reactivating your
                Perennial Mandalism access now...
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
