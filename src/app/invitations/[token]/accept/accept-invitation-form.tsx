"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/client";

const PHONE_ERROR = "Enter phone as +14155552671 or a 10-digit number.";
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_ERROR =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

type InvalidStateProps = {
  token: string;
  state: "invalid";
  title: string;
  message: string;
};

type ReadyStateProps = {
  token: string;
  state: "ready";
  email: string;
  roleSlug: string;
  roleLabel: string;
};

type AcceptInvitationFormProps = InvalidStateProps | ReadyStateProps;

function nameToUsername(fullName: string): string {
  return fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

function roleNeedsUsername(roleSlug: string) {
  return [
    "trainee",
    "advocate",
    "social_advo",
    "community_perennial_mandalism",
    "community_mystery_school",
  ].includes(roleSlug);
}

function validateUsername(username: string) {
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 30) return "Username must be 30 characters or fewer.";
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(username)) {
    return "Username must start and end with a letter or number, and can only contain lowercase letters, numbers, and hyphens.";
  }
  return null;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

function normalizeOptionalPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return digits;

  return undefined;
}

export function AcceptInvitationForm(props: AcceptInvitationFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const showPhoneField = props.state === "ready" && props.roleSlug !== "admin";
  const showUsernameField = props.state === "ready" && roleNeedsUsername(props.roleSlug);

  function handleNameChange(value: string) {
    setFullName(value);
    if (!usernameEdited) {
      setUsername(nameToUsername(value));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (props.state !== "ready") return;
    setFormError(null);

    const { firstName, lastName } = splitName(fullName);
    if (!firstName || !lastName) {
      setFormError("Enter your first and last name.");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setFormError(PASSWORD_ERROR);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    const normalizedUsername = username.trim().toLowerCase();
    if (showUsernameField) {
      const usernameError = validateUsername(normalizedUsername);
      if (usernameError) {
        setFormError(usernameError);
        return;
      }
    }

    const normalizedPhone = showPhoneField ? normalizeOptionalPhone(phone) : null;
    if (normalizedPhone === undefined) {
      setPhoneError(PHONE_ERROR);
      toast.error(PHONE_ERROR);
      return;
    }
    setPhoneError(null);

    setSubmitting(true);
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(props.token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: normalizedPhone ?? undefined,
          username: showUsernameField ? normalizedUsername : undefined,
          password,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        next?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to accept invitation.");
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: props.email,
        password,
      });

      if (signInError) {
        toast.success("Account created. Please sign in to continue.");
        router.push(`/login?next=${encodeURIComponent(payload.next ?? "/")}`);
        return;
      }

      toast.success("Invitation accepted.");
      router.push(payload.next ?? "/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invitation.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
          {props.state === "invalid" ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
                <LockKeyhole className="size-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{props.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{props.message}</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  AstrologyPro Invitation
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Create your {props.roleLabel} account
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Complete your account setup to continue.
                </p>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{props.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-full-name">Full name</Label>
                <Input
                  id="invite-full-name"
                  value={fullName}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="First and last name"
                  autoComplete="name"
                  required
                />
              </div>

              {showUsernameField && (
                <div className="space-y-2">
                  <Label htmlFor="invite-username">Your URL</Label>
                  <Input
                    id="invite-username"
                    type="text"
                    value={username}
                    onChange={(event) => {
                      setUsernameEdited(true);
                      setUsername(
                        event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30)
                      );
                    }}
                    placeholder="maya-starweaver"
                    autoComplete="username"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Your page:{" "}
                    <span className="font-medium text-foreground">
                      astrologypro.com/{username || "your-name"}
                    </span>
                  </p>
                </div>
              )}

              {showPhoneField && (
                <div className="space-y-2">
                  <Label htmlFor="invite-phone">Phone</Label>
                  <Input
                    id="invite-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setPhoneError(null);
                    }}
                    placeholder="+14155552671 or 5551234567"
                    autoComplete="tel"
                    inputMode="tel"
                    aria-invalid={phoneError ? "true" : "false"}
                    aria-describedby={phoneError ? "invite-phone-error" : "invite-phone-help"}
                  />
                  {phoneError ? (
                    <p id="invite-phone-error" className="text-xs font-medium text-destructive">
                      {phoneError}
                    </p>
                  ) : (
                    <p id="invite-phone-help" className="text-xs text-muted-foreground">
                      Optional, but must be valid if provided.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invite-password">Password</Label>
                <PasswordInput
                  id="invite-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  showStrength
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-confirm-password">Confirm password</Label>
                <PasswordInput
                  id="invite-confirm-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  confirmValue={password}
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{formError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 size-4" />
                )}
                Accept Invitation
              </Button>
            </form>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
