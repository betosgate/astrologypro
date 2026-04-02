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

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    const supabase = createClient();

    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    router.refresh();
    setCancelling(false);
  }

  return (
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
  );
}
