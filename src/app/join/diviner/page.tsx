"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ArrowRight, Loader2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_ERROR =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export default function JoinDivinerPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [profileUrlEdited, setProfileUrlEdited] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedEmail = params.get("email") ?? "";
    const token = params.get("inviteToken") ?? "";
    if (invitedEmail) {
      setEmail(invitedEmail);
    }
    if (token) {
      setInviteToken(token);
    }
  }, []);

  function handleNameChange(value: string) {
    setFullName(value);
    if (!profileUrlEdited) {
      setProfileUrl(slugify(value));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email || !fullName || !password || !confirmPassword || !profileUrl) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(PASSWORD_ERROR);
      toast.error(PASSWORD_ERROR);
      return;
    }
    setPasswordError(null);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!inviteToken) {
      toast.error(
        "Missing invitation token. Please open the link from your invitation email."
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the diviner account from the invitation.
      const res = await fetch("/api/join/diviner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          profileUrl,
          inviteToken,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        next?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? "Registration failed.");
      }

      // 2. Sign in client-side so the SSR cookies are written by the
      //    Supabase browser client. The server endpoint deliberately
      //    doesn't write cookies — keeping cookie writes in one place.
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // The account was created but auto-login failed. The plan page
        // is auth-gated, so route the user to /login with a notice.
        toast.error(
          "Account created, but auto-login failed. Please sign in to continue."
        );
        router.push("/login?next=/join/diviner/plan");
        return;
      }

      // 3. Off to plan selection — the dashboard remains gated until
      //    payment completes.
      toast.success("Account created! Choose your plan to continue.");
      router.push(payload.next ?? "/join/diviner/plan");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Registration failed."
      );
      setSubmitting(false);
    }
  }

  const pageSlug = slugify(profileUrl);
  const previewUrl = pageSlug || "your-name";

  return (
    <div className="flex min-h-screen flex-col bg-[#050816] text-white">
      <MarketingHeader />

      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(212,175,55,0.08),transparent_30%),linear-gradient(180deg,#090d1d_0%,#050816_100%)] px-4 py-10 sm:px-6">
        <div className="w-full max-w-4xl">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,17,31,0.96)_0%,rgba(7,10,20,0.96)_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/8 px-6 py-8 sm:px-10">
              <p className="text-xs uppercase tracking-[0.32em] text-[#d6b75a]">
                Diviner Portal
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Register as a Diviner
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#9ea6c5] sm:text-base">
                Create your AstrologyPro diviner profile with your name, secure
                login, and public page URL.
              </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="px-6 py-8 sm:px-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="diviner-email" className="text-base text-[#d7def5]">
                      Email
                    </Label>
                    <Input
                      id="diviner-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      readOnly
                      className="h-12 border-white/10 bg-white/[0.03] text-base text-white placeholder:text-[#626a88] read-only:cursor-not-allowed read-only:opacity-75"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diviner-name" className="text-base text-[#d7def5]">
                      Full Name
                    </Label>
                    <Input
                      id="diviner-name"
                      placeholder="Maya Starweaver"
                      value={fullName}
                      onChange={(event) => handleNameChange(event.target.value)}
                      className="h-12 border-white/10 bg-white/[0.03] text-base text-white placeholder:text-[#626a88]"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diviner-password" className="text-base text-[#d7def5]">
                      Password
                    </Label>
                    <PasswordInput
                      id="diviner-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError(null);
                      }}
                      className="h-12 border-white/10 bg-white/[0.03] text-base text-white placeholder:text-[#626a88]"
                      autoComplete="new-password"
                      minLength={8}
                      showStrength
                      aria-invalid={passwordError ? "true" : "false"}
                      aria-describedby={
                        passwordError ? "diviner-password-error" : undefined
                      }
                    />
                    {passwordError ? (
                      <p id="diviner-password-error" className="text-sm font-medium text-red-300">
                        {passwordError}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diviner-confirm-password" className="text-base text-[#d7def5]">
                      Confirm Password
                    </Label>
                    <PasswordInput
                      id="diviner-confirm-password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-12 border-white/10 bg-white/[0.03] text-base text-white placeholder:text-[#626a88]"
                      autoComplete="new-password"
                      minLength={8}
                      confirmValue={password}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diviner-url" className="text-base text-[#d7def5]">
                      Your URL
                    </Label>
                    <Input
                      id="diviner-url"
                      placeholder="maya-starweaver"
                      value={profileUrl}
                      onChange={(event) => {
                        setProfileUrlEdited(true);
                        setProfileUrl(slugify(event.target.value));
                      }}
                      className="h-12 border-white/10 bg-white/[0.03] text-base text-white placeholder:text-[#626a88]"
                      autoComplete="username"
                    />
                    <p className="text-sm text-[#8d96b8]">
                      Your page:{" "}
                      <span className="font-medium text-[#d6b75a]">
                        astrologypro.com/{previewUrl}
                      </span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-14 w-full rounded-full bg-[#d6b75a] text-lg font-semibold text-[#16120a] shadow-[0_14px_34px_rgba(214,183,90,0.28)] transition hover:bg-[#e3c76e]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Register
                        <ArrowRight className="ml-2 size-5" />
                      </>
                    )}
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-5 pt-1 text-sm text-[#8d96b8]">
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[#69d28c]" />
                      Secure onboarding
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Zap className="size-4 text-[#d6b75a]" />
                      Personalized public page
                    </span>
                  </div>

                  <p className="text-center text-sm text-[#8d96b8]">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-[#d6b75a] underline-offset-4 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </div>

              <div className="border-l border-white/8 bg-[linear-gradient(180deg,rgba(214,183,90,0.08)_0%,rgba(214,183,90,0.02)_100%)] px-6 py-8 sm:px-8">
                <div className="rounded-[24px] border border-[#d6b75a]/15 bg-black/20 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#d6b75a]">
                    Page Preview
                  </p>
                  <div className="mt-5 rounded-[22px] border border-white/8 bg-[#0b1020] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#8d96b8]">Public profile</p>
                        <p className="mt-1 text-xl font-semibold text-white">
                          {fullName || "Your diviner name"}
                        </p>
                      </div>
                      <div className="rounded-full border border-[#d6b75a]/20 bg-[#d6b75a]/10 px-3 py-1 text-xs font-medium text-[#f0d98b]">
                        Diviner
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#7e87a8]">
                        Profile Link
                      </p>
                      <p className="mt-2 text-sm text-[#d7def5]">
                        astrologypro.com/{previewUrl}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7e87a8]">
                          Email
                        </p>
                        <p className="mt-2 text-sm text-[#d7def5]">
                          {email || "you@example.com"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7e87a8]">
                          Status
                        </p>
                        <p className="mt-2 text-sm text-[#d7def5]">
                          Ready for registration
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-[#96a0c0]">
                    This route is ready for wiring into your signup backend when
                    you want the form to create real diviner accounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
