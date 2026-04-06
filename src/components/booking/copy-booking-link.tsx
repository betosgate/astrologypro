"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link2, Check } from "lucide-react";

interface CopyBookingLinkProps {
  username: string;
  serviceSlug: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}

export function CopyBookingLink({
  username,
  serviceSlug,
  label = "Copy Booking Link",
  variant = "outline",
  size = "sm",
}: CopyBookingLinkProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const link = `${appUrl}/${username}/book/${serviceSlug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Booking link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleCopy} className="gap-2">
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {copied ? "Copied!" : label}
    </Button>
  );
}
