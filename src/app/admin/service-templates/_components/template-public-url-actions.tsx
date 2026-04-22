"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TemplatePublicUrlActionsProps {
  publicUrl: string;
  disabled?: boolean;
}

export function TemplatePublicUrlActions({
  publicUrl,
  disabled = false,
}: TemplatePublicUrlActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Public URL copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy public URL");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={disabled}>
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? "Copied" : "Copy Public URL"}
      </Button>
      <Button type="button" variant="outline" size="sm" asChild disabled={disabled}>
        <Link href={publicUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Public Page
        </Link>
      </Button>
    </div>
  );
}
