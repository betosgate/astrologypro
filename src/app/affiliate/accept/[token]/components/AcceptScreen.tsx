"use client";

// Task 03 — Client-side accept form.
// Three modes driven by `isLoggedInAsInvitee` and `existingAuthUser`:
//   · session  — logged in already, email matches: show confirm
//   · signin   — anon, email has an auth user: sign-in form
//   · signup   — anon, email has no auth user: sign-up form
//
// On submit, POSTs the raw token to /api/affiliate/accept. Server hashes the
// token, validates, and runs consume_invite_and_activate_junction.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/03-accept-flow.md

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface Props {
  token: string;
  inviteEmail: string;
  inviteMessage: string | null;
  divinerDisplayName: string;
  commissionType: string | null;
  commissionValue: number | null;
  expiresAt: string;
  isLoggedInAsInvitee: boolean;
  existingAuthUser: boolean;
  defaultName: string | null;
}

function formatCommission(type: string | null, value: number | null) {
  if (!type || value === null) return "See dashboard for details";
  if (type === "percentage") return `${value}% commission`;
  if (type === "fixed") return `$${(value / 100).toFixed(2)} per referral`;
  return `${value} ${type}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AcceptScreen(props: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [name, setName] = useState(props.defaultName ?? "");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode: "session" | "signin" | "signup" = props.isLoggedInAsInvitee
    ? "session"
    : props.existingAuthUser
      ? "signin"
      : "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode !== "session" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliate/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: props.token,
          ...(mode === "session" ? {} : { password }),
          ...(mode === "signup" && name.trim() ? { name: name.trim() } : {}),
          ...(mode === "signup" && phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.detail ?? json?.title ?? `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      // Success — server has set session cookie. Navigate.
      const target =
        typeof json?.data?.redirect_to === "string"
          ? json.data.redirect_to
          : "/affiliate";
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-xl">Affiliate invitation</CardTitle>
          </div>
          <CardDescription className="pt-1">
            <strong className="text-foreground">{props.divinerDisplayName}</strong>{" "}
            invited <strong className="text-foreground">{props.inviteEmail}</strong>{" "}
            to be an affiliate partner on AstrologyPro.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Terms preview */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {formatCommission(props.commissionType, props.commissionValue)}
            </Badge>
            <Badge variant="outline">Expires {formatDate(props.expiresAt)}</Badge>
          </div>

          {props.inviteMessage && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Personal message
              </p>
              <p className="mt-1 text-sm italic">
                &ldquo;{props.inviteMessage}&rdquo;
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email always shown, always read-only */}
            <div className="space-y-1.5">
              <Label htmlFor="accept-email">Email</Label>
              <Input
                id="accept-email"
                type="email"
                value={props.inviteEmail}
                readOnly
                disabled
                aria-readonly
              />
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="accept-name">Your name</Label>
                  <Input
                    id="accept-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accept-phone">
                    Phone <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="accept-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </>
            )}

            {mode !== "session" && (
              <div className="space-y-1.5">
                <Label htmlFor="accept-password">
                  {mode === "signup" ? "Choose a password" : "Password"}
                </Label>
                <Input
                  id="accept-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  minLength={8}
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Accepting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" aria-hidden />
                  {mode === "session"
                    ? "Accept invitation"
                    : mode === "signin"
                      ? "Sign in &amp; accept"
                      : "Create account &amp; accept"}
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By accepting, you agree to the AstrologyPro affiliate partnership
            terms.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
