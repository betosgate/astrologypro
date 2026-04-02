"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Globe, Mail, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RecordingShareProps {
  shareUrl: string;
  title: string;
  description: string;
}

export function RecordingShare({
  shareUrl,
  title,
  description,
}: RecordingShareProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  function handleEmailShare() {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\nWatch here: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  function handleGlobeShare() {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "width=600,height=400"
    );
  }

  function handleMessageCircleShare() {
    const text = encodeURIComponent(`${description}`);
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "width=600,height=400"
    );
  }

  function handleWhatsAppShare() {
    const text = encodeURIComponent(`${description}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="size-4" />
          Share Recording
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="mr-1.5 size-3.5 text-green-500" />
            ) : (
              <Copy className="mr-1.5 size-3.5" />
            )}
            {copied ? "Copied" : "Copy Link"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailShare}
          >
            <Mail className="mr-1.5 size-3.5" />
            Email
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGlobeShare}
          >
            <Globe className="mr-1.5 size-3.5" />
            Globe
          </Button>

          {/* MessageCircle/X - using Share2 icon since lucide doesn't have an X/MessageCircle icon */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMessageCircleShare}
          >
            <Share2 className="mr-1.5 size-3.5" />
            X / MessageCircle
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
          >
            <MessageCircle className="mr-1.5 size-3.5" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
