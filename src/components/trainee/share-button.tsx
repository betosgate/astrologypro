"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, X } from "lucide-react";

interface ShareButtonProps {
  shareUrl: string;
}

const SHARE_TEXT =
  "I just earned my AstrologyPro Training Certificate! 🎓 Verify at: ";

export function ShareButton({ shareUrl }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard access
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareOnX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT + shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareOnWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="mr-2 size-4" />
        Share Certificate
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Share certificate"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Share Your Certificate
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close share dialog"
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Link display */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-600 break-all">
              {shareUrl}
            </div>

            {/* Copy link button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 size-4 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" />
                  Copy Verification Link
                </>
              )}
            </Button>

            {/* Social share */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Share on
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={shareOnX}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {/* X (Twitter) logo */}
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X / Twitter
                </button>

                <button
                  onClick={shareOnLinkedIn}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {/* LinkedIn logo */}
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 text-[#0A66C2]"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>

                <button
                  onClick={shareOnWhatsApp}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {/* WhatsApp logo */}
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 text-[#25D366]"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
