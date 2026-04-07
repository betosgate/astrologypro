"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CertificateCopyButtonProps {
  text: string;
}

export function CertificateCopyButton({ text }: CertificateCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 shrink-0"
      onClick={handleCopy}
      aria-label="Copy verification link"
    >
      {copied ? (
        <Check className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}
