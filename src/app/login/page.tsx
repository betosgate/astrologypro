"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Sparkles, Mail } from "lucide-react";
import { APP_URL } from "@/lib/constants";

const PORTAL_BASES = ["/dashboard", "/portal", "/community", "/mystery-school", "/trainee", "/advocate", "/admin"];

/**
 * Resolve where to send the user after a successful password login.
 * Delegates entirely to the server — reads DB last_portal_url, admin flag,
 * onboarding state, and role. Immune to stale client JS bundles.
 */
async function resolveDestination(): Promise<string> {
  try {
    const res = await fetch("/api/auth/post-login-redirect");
    if (res.ok) {
      const { destination } = await res.json();
      if (destination) return destination;
    }
  } catch {
    // ignore — fall through to safe default
  }
  return "/dashboard";
}

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  // If already logged in, skip the login page entirely
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const dest = await resolveDestination();
        router.replace(dest);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Magic link fallback state
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // If middleware redirected here from a protected route (e.g. session expired
      // while on /dashboard), honour that redirect param so the user lands back
      // where they were. Validate it against known portal bases to prevent open redirect.
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get("redirect") ?? "";
      const isTrustedRedirect =
        redirectParam &&
        PORTAL_BASES.some(
          (base) => redirectParam === base || redirectParam.startsWith(base + "/")
        );

      // Hard navigation — bypasses Next.js router cache which can serve
      // a stale server-component redirect from before the session was set.
      window.location.href = isTrustedRedirect
        ? redirectParam
        : await resolveDestination();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    setMagicLoading(true);
    try {
      const redirectParam = new URLSearchParams(window.location.search).get("redirect");
      const isTrustedRedirect =
        !!redirectParam &&
        PORTAL_BASES.some(
          (base) => redirectParam === base || redirectParam.startsWith(base + "/")
        );
      const redirectTarget = isTrustedRedirect
        ? `${APP_URL}/auth/callback?next=${encodeURIComponent(redirectParam)}`
        : `${APP_URL}/auth/callback`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: { emailRedirectTo: redirectTarget },
      });
      if (otpError) { setMagicError(otpError.message); return; }
      setMagicSent(true);
    } catch {
      setMagicError("An unexpected error occurred. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your AstrologyPro account</CardDescription>
          </CardHeader>

          <CardContent>
            {showMagicLink ? (
              magicSent ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Check your email</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We sent a sign-in link to{" "}
                      <span className="font-medium text-foreground">{magicEmail}</span>.
                      Click it to sign in.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => { setMagicSent(false); setShowMagicLink(false); }} className="w-full">
                    Back to sign in
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="you@example.com"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll email you a secure link — no password needed.
                  </p>
                  {magicError && <p className="text-sm text-destructive">{magicError}</p>}
                  <Button type="submit" className="w-full" disabled={magicLoading}>
                    {magicLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Sign-in Link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowMagicLink(false)}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to password sign in
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setShowMagicLink(true); setMagicEmail(email); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    No password? Sign in with email link
                  </button>
                  <Link
                    href="/reset-password"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Want to offer readings?{" "}
              <Link
                href="/get-started"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Get started as a diviner
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>

      <MarketingFooter />
    </div>
  );
}
