"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

interface CancelBookingButtonProps {
  bookingId: string;
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    setError("");
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "canceled" })
      .eq("id", bookingId);

    if (updateError) {
      setError("Failed to cancel. Please try again.");
      setCancelling(false);
      return;
    }

    router.refresh();
    setCancelling(false);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleCancel}
        disabled={cancelling}
        className="text-destructive hover:text-destructive"
      >
        {cancelling ? (
          <Loader2 className="mr-1 size-3 animate-spin" />
        ) : (
          <XCircle className="mr-1 size-3" />
        )}
        Cancel
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
