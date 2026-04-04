"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Share2, DollarSign, Users, TrendingUp } from "lucide-react";
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
    if (!form.name || !form.email || !form.password || !form.username) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      let userId = existingUserId;

      if (!userId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { name: form.name, username: form.username, role: "social_advo" },
          },
        });
        if (signUpError) { toast.error(signUpError.message); return; }
        userId = signUpData.user?.id ?? null;
      }

      if (!userId) { toast.error("Signup failed. Please try again."); return; }

      const { error: insertError } = await supabase
        .from("social_advocates")
        .insert({
          user_id: userId,
          name: form.name,
          email: form.email,
          username: form.username,
          referral_code: generateCode(form.name),
          onboarding_completed: true,
        });

      if (insertError) { toast.error("Could not create advocate profile. Username may be taken."); return; }

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

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Become a Social Advocate</h1>
            <p className="mt-2 text-muted-foreground">Share the magic of AstrologyPro and earn commission on every booking you bring in.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Perks */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">What you get</h2>
              {perks.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.text} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>Free to join. Start earning immediately.</CardDescription>
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
                  <p className="text-center text-xs text-muted-foreground">Already have an account? <a href="/login" className="text-primary underline-offset-4 hover:underline">Sign in</a></p>
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
