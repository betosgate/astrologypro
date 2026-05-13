"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

const SERVICES_PATH = "/services";

async function redirectToServicesWithDiscount() {
  try {
    const res = await fetch("/api/community/discount-token", {
      method: "POST",
    });

    if (!res.ok) {
      window.location.href = SERVICES_PATH;
      return;
    }

    const { token } = (await res.json()) as { token?: string };
    if (typeof token === "string" && token.length > 0) {
      window.location.href = `${SERVICES_PATH}?discount_token=${encodeURIComponent(token)}`;
      return;
    }
  } catch {
    // Fall through to the non-discount services hub.
  }

  window.location.href = SERVICES_PATH;
}

interface PerennialReadingButtonProps
  extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  className?: string;
  loadingLabel?: string;
}

export function PerennialReadingButton({
  children,
  className,
  loadingLabel = "Preparing...",
  variant = "default",
  size = "default",
}: PerennialReadingButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await redirectToServicesWithDiscount();
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? loadingLabel : children}
    </Button>
  );
}

interface PerennialReadingCtaProps {
  children: ReactNode;
  className?: string;
  loadingLabel?: string;
}

export function PerennialReadingCta({
  children,
  className,
  loadingLabel = "Preparing...",
}: PerennialReadingCtaProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await redirectToServicesWithDiscount();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn("cursor-pointer disabled:pointer-events-none disabled:opacity-60", className)}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
