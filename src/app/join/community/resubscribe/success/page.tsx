"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, RefreshCcw, TriangleAlert, ArrowRight } from "lucide-react";
import { Suspense } from "react";

/**
 * /join/community/resubscribe/success
 *
 * After Stripe checkout, this page polls POST /api/community/resubscribe-finalize
 * with the session_id. The finalize endpoint verifies the Stripe session is
 * complete + paid, then sets community_members.membership_status = 'active'.
 *
 * Same pattern as Mystery School checkout success — no webhook dependency.
 */

type FinalizeState = "loading" | "success" | "failed" | "unauthorized";

function ResubscribeSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";

  const [state, setState] = useState<FinalizeState>(sessionId ? "loading" : "failed");
  const [message, setMessage] = useState(
    sessionId
      ? "We are confirming your payment and reactivating your membership."
      : "Stripe did not return a checkout session ID."
  );

  const loginHref = useMemo(() => {
    const next = `/join/community/resubscribe/success${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`;
    return `/login?redirect=${encodeURIComponent(next)}`;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function finalizeOnce(): Promise<"success" | "pending" | "failed" | "unauthorized"> {
      const res = await fetch("/api/community/resubscribe-finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setMessage(data.message ?? "Please sign in to complete resubscription.");
        return "unauthorized";
      }
      if (res.status === 202) {
        setMessage(data.message ?? "Stripe is still processing your payment.");
        return "pending";
      }
      if (!res.ok || data.status === "failed") {
        setMessage(data.message ?? "Could not reactivate your membership.");
        return "failed";
      }

      const redirectTo = typeof data.redirectTo === "string" ? data.redirectTo : "/community";
      if (!cancelled) {
        setState("success");
        setMessage("Your membership is active again. Redirecting to your dashboard...");
        setTimeout(() => router.replace(redirectTo), 900);
      }
      return "success";
    }

    async function run() {
      for (let attempt = 0; attempt < 8; attempt++) {
        const result = await finalizeOnce();
        if (cancelled) return;
        if (result === "success") return;
        if (result === "failed") { setState("failed"); return; }
        if (result === "unauthorized") { setState("unauthorized"); return; }
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (!cancelled) {
        setState("failed");
        setMessage("Could not confirm your resubscription automatically. Please refresh or contact support.");
      }
    }

    run();
    return () => { cancelled = true; };
  }, [router, sessionId]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {state === "success" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="size-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">{message}</p>
              </CardContent>
            </Card>
          )}

          {state === "unauthorized" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <TriangleAlert className="size-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Sign In to Continue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild size="lg" className="gap-2">
                    <Link href={loginHref}>Sign In <ArrowRight className="size-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {state === "failed" && (
            <Card className="border-destructive/30">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <TriangleAlert className="size-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Almost There</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCcw className="size-4" /> Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {state === "loading" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
                <CardTitle className="text-2xl">Activating Your Membership</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">{message}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

export default function ResubscribeSuccessPage() {
  return (
    <Suspense>
      <ResubscribeSuccessClient />
    </Suspense>
  );
}
