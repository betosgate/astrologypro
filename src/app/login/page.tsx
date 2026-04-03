"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Mail } from "lucide-react";
import { APP_URL } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Diviner tab state
  const [divinerEmail, setDivinerEmail] = useState("");
  const [divinerPassword, setDivinerPassword] = useState("");
  const [divinerLoading, setDivinerLoading] = useState(false);
  const [divinerError, setDivinerError] = useState("");

  // Client tab state
  const [clientEmail, setClientEmail] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleDivinerLogin(e: React.FormEvent) {
    e.preventDefault();
    setDivinerError("");
    setDivinerLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: divinerEmail,
        password: divinerPassword,
      });

      if (error) {
        setDivinerError(error.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setDivinerError("An unexpected error occurred. Please try again.");
    } finally {
      setDivinerLoading(false);
    }
  }

  async function handleClientLogin(e: React.FormEvent) {
    e.preventDefault();
    setClientError("");
    setClientLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: clientEmail,
        options: {
          emailRedirectTo: `${APP_URL}/auth/callback?next=/portal`,
        },
      });

      if (error) {
        setClientError(error.message);
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setClientError("An unexpected error occurred. Please try again.");
    } finally {
      setClientLoading(false);
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
            <CardDescription>
              Sign in to your AstrologyPro account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="diviner" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="diviner">Diviner</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
              </TabsList>

              <TabsContent value="diviner" className="mt-4">
                <form onSubmit={handleDivinerLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="diviner-email">Email</Label>
                    <Input
                      id="diviner-email"
                      type="email"
                      placeholder="you@example.com"
                      value={divinerEmail}
                      onChange={(e) => setDivinerEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diviner-password">Password</Label>
                    <PasswordInput
                      id="diviner-password"
                      placeholder="Your password"
                      value={divinerPassword}
                      onChange={(e) => setDivinerPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/reset-password"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {divinerError && (
                    <p className="text-sm text-destructive">{divinerError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={divinerLoading}
                  >
                    {divinerLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    New diviner?{" "}
                    <Link
                      href="/get-started"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Get started here
                    </Link>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="client" className="mt-4">
                {magicLinkSent ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Check your email
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We sent a magic link to{" "}
                        <span className="font-medium text-foreground">
                          {clientEmail}
                        </span>
                        . Click the link in your email to sign in.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setMagicLinkSent(false)}
                      className="w-full"
                    >
                      Use a different email
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleClientLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-email">Email</Label>
                      <Input
                        id="client-email"
                        type="email"
                        placeholder="you@example.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      No password needed. We&apos;ll email you a secure magic
                      link to sign in instantly.
                    </p>

                    {clientError && (
                      <p className="text-sm text-destructive">{clientError}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={clientLoading}
                    >
                      {clientLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        "Send Magic Link"
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
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
