"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";

type FinalizeState = "loading" | "success" | "failed" | "unauthorized";

export function MysterySchoolCheckoutStatusClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";

  const [state, setState] = useState<FinalizeState>(sessionId ? "loading" : "failed");
  const [message, setMessage] = useState(
    sessionId
      ? "We are confirming your payment and opening the gates."
      : "Stripe did not return a checkout session ID, so we could not verify your purchase."
  );

  const loginHref = useMemo(() => {
    const next = `/mystery-school/checkout/success${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`;
    return `/login?redirect=${encodeURIComponent(next)}`;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    async function finalizeOnce(): Promise<"success" | "pending" | "failed" | "unauthorized"> {
      const res = await fetch("/api/mystery-school/checkout/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setMessage(data.message ?? "Please sign in to complete your enrollment.");
        return "unauthorized";
      }

      if (res.status === 202) {
        setMessage(data.message ?? "Stripe is still finalizing your enrollment.");
        return "pending";
      }

      if (!res.ok || data.status === "failed") {
        setMessage(data.message ?? "We could not finalize your enrollment.");
        return "failed";
      }

      const redirectTo = typeof data.redirectTo === "string" ? data.redirectTo : "/mystery-school";
      startRedirect(redirectTo);
      return "success";
    }

    function startRedirect(redirectTo: string) {
      if (cancelled) return;
      setState("success");
      setMessage("Your payment was confirmed. Opening your Mystery School dashboard now.");
      window.setTimeout(() => {
        router.replace(redirectTo);
      }, 900);
    }

    async function run() {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const result = await finalizeOnce();
        if (cancelled) return;
        if (result === "success") return;
        if (result === "failed") {
          setState("failed");
          return;
        }
        if (result === "unauthorized") {
          setState("unauthorized");
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }

      if (!cancelled) {
        setState("failed");
        setMessage("We could not confirm your enrollment automatically. Please retry or contact support with your payment email.");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  if (state === "success") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Enrollment Confirmed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-3 py-1 text-sm">Mystery School Access Granted</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "unauthorized") {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
            <TriangleAlert className="size-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Sign In To Complete Enrollment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href={loginHref}>
                Sign In <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/mystery-school/enroll">Back to Enrollment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "failed") {
    return (
      <Card className="border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
            <TriangleAlert className="size-8 text-destructive" />
          </div>
          <CardTitle className="text-3xl">We Could Not Finalize Enrollment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="rounded-xl border bg-muted/40 p-4 text-left text-sm text-muted-foreground">
            If Stripe already charged you, return to this page once more or contact support with your payment email and checkout time.
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()} size="lg" className="gap-2">
              <RefreshCcw className="size-4" /> Try Again
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/mystery-school/enroll">Back to Enrollment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
        <CardTitle className="text-3xl">Finalizing Your Enrollment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-3 py-1 text-sm">Stripe Payment Verified Server-Side</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
