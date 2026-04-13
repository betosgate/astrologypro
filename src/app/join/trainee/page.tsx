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
import { Loader2, GraduationCap, Star, Users, BookOpen, TrendingUp } from "lucide-react";
import { toast } from "sonner";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function JoinTraineeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvited = searchParams.get("invited") === "true";
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", username: "", inviteCode: "" });

  // If arriving via admin invite, user is already authenticated
  useEffect(() => {
    if (isInvited) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setExistingUserId(data.user.id);
          setForm((prev) => ({ ...prev, email: data.user?.email ?? "" }));
        }
      });
    }
  }, [isInvited]);

  function set(field: string, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !prev.username) updated.username = slugify(value);
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.username) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      // Validate invite code if provided
      let mentorDivinerId: string | null = null;
      if (form.inviteCode) {
        const res = await fetch(`/api/trainees/validate-invite?code=${encodeURIComponent(form.inviteCode)}`);
        if (!res.ok) { toast.error("Invalid invite code. Please check with your mentor."); return; }
        const data = await res.json();
        mentorDivinerId = data.divinerId ?? null;
      }

      const supabase = createClient();
      let userId = existingUserId;

      if (!userId) {
        // New signup — create auth user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { name: form.name, username: form.username, role: "trainee" },
          },
        });
        if (signUpError) { toast.error(signUpError.message); return; }
        userId = signUpData.user?.id ?? null;
      }

      if (!userId) { toast.error("Signup failed. Please try again."); return; }

      const { error: insertError } = await supabase
        .from("trainees")
        .insert({
          user_id: userId,
          name: form.name,
          email: form.email,
          username: form.username,
          mentor_diviner_id: mentorDivinerId,
          training_status: "active",
          onboarding_completed: false,
        });

      if (insertError) { toast.error("Could not create trainee profile. Username may be taken."); return; }

      toast.success("Account created! Let's complete your profile.");
      router.push("/join/trainee/profile");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const benefits = [
    { icon: GraduationCap, text: "Learn from experienced diviner mentors" },
    { icon: BookOpen, text: "Access curated study materials and guides" },
    { icon: Star, text: "Practice readings with structured feedback" },
    { icon: TrendingUp, text: "Track your progress from trainee to graduate" },
    { icon: Users, text: "Join a community of practitioners-in-training" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Join as a Trainee</h1>
            <p className="mt-2 text-muted-foreground">Begin your journey into the divination arts under the guidance of a master practitioner.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your training path</h2>
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.text} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
                  </div>
                );
              })}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Create Trainee Account</CardTitle>
                <CardDescription>Have a mentor invite code? Enter it below to be connected automatically.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="t-name">Full Name</Label>
                    <Input id="t-name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-username">Username</Label>
                    <Input id="t-username" placeholder="your-username" value={form.username} onChange={(e) => set("username", slugify(e.target.value))} required />
                  </div>
                  {!isInvited && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="t-email">Email</Label>
                        <Input id="t-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="t-password">Password</Label>
                        <PasswordInput id="t-password" placeholder="Create a password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
                      </div>
                    </>
                  )}
                  {isInvited && form.email && (
                    <p className="text-sm text-muted-foreground">Completing setup for <span className="font-medium text-foreground">{form.email}</span></p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="t-invite">Mentor Invite Code <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="t-invite" placeholder="e.g. MENTOR-ABC123" value={form.inviteCode} onChange={(e) => set("inviteCode", e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating account…</> : "Begin Training"}
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

export default function JoinTraineePage() {
  return (
    <Suspense>
      <JoinTraineeContent />
    </Suspense>
  );
}
