"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Share2, DollarSign, Users, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function generateCode(name: string) {
  return (slugify(name).slice(0, 8) + Math.random().toString(36).slice(2, 6)).slice(0, 12).toUpperCase();
}

function JoinAdvocateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvited = searchParams.get("invited") === "true";
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", username: "" });

  useEffect(() => {
    if (isInvited) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setExistingUserId(data.user.id);
          setForm((prev) => ({ ...prev, email: data.user?.email ?? "", name: data.user?.user_metadata?.name ?? "" }));
        }
      });
    }
  }, [isInvited]);

  function set(field: string, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !prev.username) {
        updated.username = slugify(value);
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.username || (!isInvited && !form.password)) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      let userId = existingUserId;

      if (!userId) {
        const response = await fetch("/api/join/advocate/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = (await response.json()) as { userId?: string; error?: string };
        if (!response.ok) {
          toast.error(json.error ?? "Could not create advocate account.");
          return;
        }
        userId = json.userId ?? null;

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          toast.error(signInError.message);
          return;
        }
      }

      if (!userId) { toast.error("Signup failed. Please try again."); return; }

      if (isInvited) {
        const { error: insertError } = await supabase
          .from("social_advocates")
          .insert({
            user_id: userId,
            name: form.name,
            email: form.email,
            username: form.username,
            referral_code: generateCode(form.name),
            onboarding_completed: true,
            is_active: true,
          });

        if (insertError) {
          toast.error("Could not create advocate profile. Username may be taken.");
          return;
        }
      }

      toast.success("Welcome! Your advocate account is ready.");
      router.push("/advocate");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const perks = [
    { icon: DollarSign, text: "Earn 10% commission on every booking you refer" },
    { icon: Share2, text: "Get a unique referral link to share on all platforms" },
    { icon: Users, text: "Track your referrals and earnings in real time" },
    { icon: TrendingUp, text: "No cap — the more you share, the more you earn" },
  ];

  const steps = [
    "Create your advocate account and claim your referral code.",
    "Share your AstrologyPro referral link on social, email, or community channels.",
    "Track clicks, referrals, and payouts from your advocate dashboard.",
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_35%),linear-gradient(180deg,#090816,#05040d)] px-4 py-12">
        <div className="w-full max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-[#c9a84c]">Affiliate Program</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Become a Social Advocate</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
              Bring aligned clients to AstrologyPro, earn commission on every successful booking, and manage everything from a dedicated advocate portal.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">What you get</h2>
                <div className="mt-5 space-y-4">
              {perks.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.text} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#c9a84c]/10">
                      <Icon className="size-4 text-[#f1d998]" />
                    </div>
                    <p className="mt-1 text-sm text-zinc-300">{p.text}</p>
                  </div>
                );
              })}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">How it works</h2>
                <div className="mt-5 space-y-4">
                  {steps.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-sm font-medium text-[#f1d998]">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-sm text-zinc-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white">Built for real promoters</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    "Dedicated dashboard for referrals, commissions, and content",
                    "Unique advocate code and shareable referral URL",
                    "Campaign reporting so you know what channels convert",
                    "Structured payout tracking instead of spreadsheet chaos",
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#c9a84c]" />
                      <p className="text-sm text-zinc-300">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    href="/login?redirect=%2Fadvocate"
                    className="inline-flex items-center gap-2 text-sm text-[#f1d998] transition hover:text-white"
                  >
                    Already an advocate? Open your dashboard <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>

            <Card className="border-white/10 bg-black/40 text-white">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription className="text-zinc-400">Free to join. Start earning immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="your-username" value={form.username} onChange={(e) => set("username", slugify(e.target.value))} required />
                  </div>
                  {!isInvited && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput id="password" placeholder="Create a password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
                      </div>
                    </>
                  )}
                  {isInvited && form.email && (
                    <p className="text-sm text-muted-foreground">Completing setup for <span className="font-medium text-foreground">{form.email}</span></p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating account…</> : "Join as Advocate"}
                  </Button>
                  <p className="text-center text-xs text-zinc-400">
                    Already have an account?{" "}
                    <Link href="/login?redirect=%2Fadvocate" className="text-[#f1d998] underline-offset-4 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

export default function JoinAdvocatePage() {
  return (
    <Suspense>
      <JoinAdvocateContent />
    </Suspense>
  );
}
