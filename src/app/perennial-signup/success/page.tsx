import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail } from "lucide-react";

export const metadata = {
  title: "Perennial Mandalism — Welcome",
};

export default async function PerennialSignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to Perennial Mandalism
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment has been received. We&apos;re creating an account for
            every household member now — each member will receive an email with
            their login credentials in the next few moments.
          </p>
        </div>
        <div className="rounded-md border bg-muted/30 p-4 text-left text-xs space-y-2">
          <div className="flex items-start gap-2">
            <Mail className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-muted-foreground">
              Check your inbox (and spam folder) for an email from us with the
              subject{" "}
              <em>&quot;Welcome to Perennial Mandalism — your account credentials&quot;</em>.
            </p>
          </div>
          {session_id && (
            <p className="font-mono text-[11px] text-muted-foreground/70 break-all">
              Reference: {session_id}
            </p>
          )}
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Continue to login</Link>
        </Button>
      </div>
    </div>
  );
}
