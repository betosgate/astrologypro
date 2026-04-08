import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { MysterySchoolCheckoutStatusClient } from "@/components/mystery-school/checkout-status-client";

export const metadata = { title: "Finalizing Mystery School Enrollment - AstrologyPro" };

export default function MysterySchoolCheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Mystery School Checkout
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">One Moment While We Open The Gates</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Your payment returned from Stripe. We are confirming the subscription and provisioning your Mystery School access now.
        </p>
      </div>

      <Suspense>
        <MysterySchoolCheckoutStatusClient />
      </Suspense>
    </div>
  );
}
