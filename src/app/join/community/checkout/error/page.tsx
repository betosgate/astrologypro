import Link from "next/link";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Perennial Mandalism Payment Not Completed - AstrologyPro" };

function getMessage(reason: string | undefined) {
  switch (reason) {
    case "missing-session":
      return "Stripe did not return a checkout session, so we could not confirm the payment.";
    case "provision-failed":
      return "Your payment returned from Stripe, but we could not finish activating the membership.";
    case "cancelled":
      return "Checkout was cancelled before payment was completed.";
    default:
      return "We could not complete the Perennial Mandalism payment flow.";
  }
}

export default async function CommunityCheckoutErrorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reasonParam = resolvedSearchParams.reason;
  const reason = Array.isArray(reasonParam) ? reasonParam[0] : reasonParam;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-9 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Payment not completed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {getMessage(reason)}
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/trainee">
              <RefreshCcw className="mr-2 size-4" />
              OK
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            You can restart the Perennial Mandalism checkout from your trainee dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
