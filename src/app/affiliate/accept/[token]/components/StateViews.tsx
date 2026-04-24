// Terminal-state views for the affiliate-accept flow.
// Each one is a small read-only card — the user either clicks back to the
// homepage, to their dashboard, or to sign out.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/03-accept-flow.md

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalLogoutButton } from "@/components/portal/logout-button";
import { AlertCircle, CheckCircle2, Clock, Ban, MailWarning } from "lucide-react";

function Shell({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start gap-3">
          <div aria-hidden>{icon}</div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}

export function InviteNotFoundView() {
  return (
    <Shell
      icon={<AlertCircle className="size-5 text-amber-500" aria-hidden />}
      title="Invitation not found"
    >
      <p>
        We couldn&rsquo;t find an invitation matching this link. It may have
        been mistyped or already cleared out.
      </p>
      <p>
        If you received the invitation via email, open the link directly from
        the email instead of copying it.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </Shell>
  );
}

export function InviteAlreadyUsedView() {
  return (
    <Shell
      icon={<CheckCircle2 className="size-5 text-emerald-500" aria-hidden />}
      title="Invitation already accepted"
    >
      <p>
        This invitation has already been claimed. If that was you, sign in to
        your affiliate portal.
      </p>
      <Button asChild>
        <Link href="/login?next=/affiliate">Sign in</Link>
      </Button>
    </Shell>
  );
}

export function InviteRevokedView() {
  return (
    <Shell
      icon={<Ban className="size-5 text-rose-500" aria-hidden />}
      title="Invitation revoked"
    >
      <p>
        The diviner who invited you has revoked this invitation. If this
        wasn&rsquo;t intentional, reach out to them to have it re-sent.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </Shell>
  );
}

export function InviteExpiredView() {
  return (
    <Shell
      icon={<Clock className="size-5 text-amber-500" aria-hidden />}
      title="Invitation expired"
    >
      <p>
        This invitation has expired. Ask the diviner to send a new one — they
        can resend it from their dashboard.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </Shell>
  );
}

export function EmailMismatchView({
  currentEmail,
  inviteEmail,
}: {
  currentEmail: string;
  inviteEmail: string;
}) {
  return (
    <Shell
      icon={<MailWarning className="size-5 text-amber-500" aria-hidden />}
      title="Email does not match"
    >
      <p>
        You&rsquo;re signed in as{" "}
        <strong className="text-foreground">{currentEmail}</strong>, but this
        invitation was sent to{" "}
        <strong className="text-foreground">{inviteEmail}</strong>.
      </p>
      <p>
        Sign out and open the invite link again, or ask the diviner to re-invite
        your current email.
      </p>
      <PortalLogoutButton variant="outline" size="default">
        Sign out
      </PortalLogoutButton>
    </Shell>
  );
}
