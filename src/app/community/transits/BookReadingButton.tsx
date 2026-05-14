import { PerennialReadingButton } from "@/components/community/perennial-reading-cta";
import { Sparkles } from "lucide-react";

/**
 * Client component — calls POST /api/community/discount-token to get/create a
 * member discount token, then redirects to the services hub with the token
 * appended as a query param.
 */
export function BookReadingButton() {
  return (
    <PerennialReadingButton
      size="sm"
      className="gap-1.5"
      loadingLabel="Preparing..."
    >
      <Sparkles className="size-3.5" />
      Book a Reading (5% member discount)
    </PerennialReadingButton>
  );
}
