"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { APP_URL } from "@/lib/constants";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: APP_URL + "/auth/reset",
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your email for a reset link"
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                    Click the link in your email to set a new password.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSent(false)}
                  className="w-full"
                >
                  Use a different email
                </Button>

                <p className="text-sm text-muted-foreground">
                  <Link
                    href="/login"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Back to login
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <MarketingFooter />
    </div>
  );
}
