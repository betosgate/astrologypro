"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Sparkles,
  Zap,
  Share2,
  ChevronRight,
  Star,
} from "lucide-react";

// --- Types ---

interface ShareHubProps {
  token: string;
  caption: string;
  imageUrl: string | null;
  trackingUrl: string;
  initialShares: Record<string, string>;
  divinerName: string;
  divinerUsername: string;
  divinerAvatar: string | null;
  // Mundane share fields (optional — only present on mundane batches)
  isMundane?: boolean;
  shareNumber?: number | null;
  shareDate?: string | null;
}

interface PlatformDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  type: "share" | "download";
}

// --- Platform definitions ---

const PLATFORMS: PlatformDef[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    type: "share",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: "𝕏",
    color: "text-neutral-200",
    bgColor: "bg-neutral-500/10 border-neutral-500/20",
    type: "share",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "w",
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/20",
    type: "share",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "in",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10 border-sky-500/20",
    type: "share",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "ig",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/20",
    type: "download",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "tk",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10 border-fuchsia-500/20",
    type: "download",
  },
];

// --- Share URL builders ---

function getShareUrl(
  platformId: string,
  caption: string,
  trackingUrl: string
): string {
  const encodedUrl = encodeURIComponent(trackingUrl);
  const encodedCaption = encodeURIComponent(caption);

  switch (platformId) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedCaption}%20${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default:
      return "#";
  }
}

// --- Confetti animation ---

function ConfettiOverlay() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    emoji: ["⭐", "✨", "🌟", "💫", "🎉", "🎊", "💜", "🔮"][i % 8],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${2 + Math.random() * 2}s`,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti text-2xl"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

// --- Main component ---

function formatShareDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ShareHub({
  token,
  caption,
  imageUrl,
  trackingUrl,
  initialShares,
  divinerName,
  divinerAvatar,
  isMundane = false,
  shareNumber = null,
  shareDate = null,
}: ShareHubProps) {
  const [shares, setShares] = useState<Record<string, string>>(initialShares);
  const [copied, setCopied] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardWaiting, setWizardWaiting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiShown = useRef(false);

  const sharedCount = Object.keys(shares).length;
  const totalPlatforms = PLATFORMS.length;
  const allDone = sharedCount >= totalPlatforms;

  // Show confetti when all platforms are shared
  useEffect(() => {
    if (allDone && !confettiShown.current) {
      confettiShown.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  // Track a share to the API
  const trackShare = useCallback(
    async (platform: string) => {
      if (shares[platform]) return; // Already shared

      try {
        const res = await fetch("/api/share/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, platform }),
        });

        if (res.ok) {
          const data = await res.json();
          setShares(data.shares);
        }
      } catch (err) {
        console.error("[ShareHub] Track error:", err);
        // Optimistically mark as shared anyway
        setShares((prev) => ({
          ...prev,
          [platform]: new Date().toISOString(),
        }));
      }
    },
    [token, shares]
  );

  // Open platform share link and track it
  const handleShareClick = useCallback(
    (platform: PlatformDef) => {
      if (platform.type === "share") {
        const url = getShareUrl(platform.id, caption, trackingUrl);
        window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
      }
      trackShare(platform.id);
    },
    [caption, trackingUrl, trackShare]
  );

  // Copy caption to clipboard
  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = caption;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [caption]);

  // Download image
  const handleDownloadImage = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "astrologypro-content.jpg";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [imageUrl]);

  // --- Wizard logic ---

  const wizardPlatforms = PLATFORMS.filter((p) => !shares[p.id]);

  const startWizard = useCallback(() => {
    setWizardStep(0);
    setWizardOpen(true);
    setWizardWaiting(false);
  }, []);

  const handleWizardShare = useCallback(
    (platform: PlatformDef) => {
      setWizardWaiting(true);

      if (platform.type === "share") {
        const url = getShareUrl(platform.id, caption, trackingUrl);
        window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
      }

      trackShare(platform.id);

      // Auto-advance after a brief delay
      setTimeout(() => {
        setWizardWaiting(false);
        setWizardStep((prev) => {
          const next = prev + 1;
          if (next >= wizardPlatforms.length) {
            setWizardOpen(false);
          }
          return next;
        });
      }, 2500);
    },
    [caption, trackingUrl, trackShare, wizardPlatforms.length]
  );

  const currentWizardPlatform = wizardPlatforms[wizardStep] ?? null;

  // --- Render ---

  return (
    <>
      {showConfetti && <ConfettiOverlay />}

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>

      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 text-center">
          {divinerAvatar ? (
            <img
              src={divinerAvatar}
              alt={divinerName}
              className="mx-auto mb-3 size-14 rounded-full border-2 border-primary/30 object-cover"
            />
          ) : (
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/20">
              <Star className="size-6 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            {isMundane && shareNumber
              ? `Your Share ${shareNumber} of 2`
              : "Your Weekly Content"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ready to share, {divinerName}
          </p>

          {/* Mundane share number badge */}
          {isMundane && shareNumber && (
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                <Sparkles className="size-3" />
                Share {shareNumber} of 2
                {shareDate ? ` | ${formatShareDate(shareDate)}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Content Preview */}
        <Card className="mb-6 overflow-hidden border-border/50">
          {imageUrl && (
            <div className="relative aspect-[16/9] w-full bg-muted">
              <img
                src={imageUrl}
                alt="Content preview"
                className="size-full object-cover"
              />
            </div>
          )}

          {/* Composited image tip for mundane shares */}
          {isMundane && imageUrl && imageUrl.includes("/api/mundane/image") && (
            <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
              <p className="text-xs text-amber-400">
                <strong>Instagram &amp; TikTok:</strong> Click &ldquo;Download Image&rdquo; below — your URL is already embedded in the bottom strip of the image.
              </p>
            </div>
          )}

          <CardContent className="p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {caption}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCaption}
                className="gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy Caption
                  </>
                )}
              </Button>
              {imageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImage}
                  className="gap-1.5 text-xs"
                >
                  <Download className="size-3.5" />
                  Download Image
                </Button>
              )}
              {isMundane && imageUrl && imageUrl.includes("/api/mundane/image") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
                  className="gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                >
                  <ExternalLink className="size-3.5" />
                  Open Full Image
                </Button>
              )}
            </div>

            {/* Other platforms note for mundane shares */}
            {isMundane && (
              <p className="mt-3 text-xs text-muted-foreground">
                <strong className="text-foreground/70">Twitter, Facebook, LinkedIn:</strong> Share the link below — your URL is in the caption.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Share Everywhere Button */}
        {!allDone && (
          <Button
            size="lg"
            onClick={startWizard}
            className="mb-6 h-14 gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-semibold shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40"
          >
            <Zap className="size-5" />
            SHARE EVERYWHERE
            <span className="ml-1 text-sm font-normal text-white/70">
              Share to all in 30 sec
            </span>
          </Button>
        )}

        {/* All done celebration */}
        {allDone && (
          <Card className="mb-6 border-green-500/30 bg-green-500/5">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-2 text-4xl">🎉</div>
              <h2 className="text-lg font-bold text-green-400">
                You&apos;re a marketing machine!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                All platforms shared. Your audience will love this content.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              or pick platforms
            </span>
          </div>
        </div>

        {/* Platform List */}
        <div className="mb-6 space-y-3">
          {PLATFORMS.map((platform) => {
            const isShared = !!shares[platform.id];

            return (
              <div
                key={platform.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  isShared
                    ? "border-green-500/30 bg-green-500/5"
                    : `${platform.bgColor}`
                }`}
              >
                {/* Platform icon */}
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg font-bold ${
                    isShared
                      ? "bg-green-500/20 text-green-400"
                      : `bg-white/5 ${platform.color}`
                  }`}
                >
                  {isShared ? (
                    <Check className="size-5" />
                  ) : (
                    <span className="text-sm">{platform.icon}</span>
                  )}
                </div>

                {/* Platform name + status */}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${isShared ? "text-green-400" : ""}`}
                  >
                    {platform.name}
                  </p>
                  {isShared && (
                    <p className="text-xs text-green-500/70">Shared</p>
                  )}
                </div>

                {/* Action button */}
                {isShared ? (
                  <Badge
                    variant="outline"
                    className="border-green-500/30 bg-green-500/10 text-green-400"
                  >
                    <Check className="mr-1 size-3" />
                    Done
                  </Badge>
                ) : platform.type === "share" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleShareClick(platform)}
                    className="gap-1.5"
                  >
                    Share
                    <ExternalLink className="size-3.5" />
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    {imageUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          handleDownloadImage();
                          trackShare(platform.id);
                        }}
                        className="gap-1 text-xs"
                      >
                        <Download className="size-3" />
                        Save
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        handleCopyCaption();
                        trackShare(platform.id);
                      }}
                      className="gap-1 text-xs"
                    >
                      <Copy className="size-3" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Share2 className="size-3.5" />
              Progress
            </span>
            <span>
              {sharedCount}/{totalPlatforms} shared
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${(sharedCount / totalPlatforms) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto text-center">
          <p className="text-xs text-muted-foreground/50">
            Powered by AstrologyPro
          </p>
        </div>
      </div>

      {/* Share Everywhere Wizard Modal */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-400" />
              Share Everywhere
            </DialogTitle>
            <DialogDescription>
              {wizardPlatforms.length === 0
                ? "All done!"
                : `Step ${wizardStep + 1} of ${wizardPlatforms.length}`}
            </DialogDescription>
          </DialogHeader>

          {currentWizardPlatform && !wizardWaiting && (
            <div className="space-y-4 py-2">
              <div
                className={`flex items-center gap-3 rounded-xl border p-4 ${currentWizardPlatform.bgColor}`}
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-lg bg-white/5 text-lg font-bold ${currentWizardPlatform.color}`}
                >
                  {currentWizardPlatform.icon}
                </div>
                <div>
                  <p className="font-medium">
                    {currentWizardPlatform.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentWizardPlatform.type === "share"
                      ? "Tap to open and share"
                      : "Download image + copy caption"}
                  </p>
                </div>
              </div>

              {currentWizardPlatform.type === "share" ? (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => handleWizardShare(currentWizardPlatform)}
                >
                  Share to {currentWizardPlatform.name}
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  {imageUrl && (
                    <Button
                      variant="secondary"
                      className="flex-1 gap-1.5"
                      onClick={handleDownloadImage}
                    >
                      <Download className="size-4" />
                      Download
                    </Button>
                  )}
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      handleCopyCaption();
                      handleWizardShare(currentWizardPlatform);
                    }}
                  >
                    <Copy className="size-4" />
                    Copy & Next
                  </Button>
                </div>
              )}

              {/* Mini progress in wizard */}
              <div className="flex justify-center gap-1.5">
                {wizardPlatforms.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-all ${
                      i < wizardStep
                        ? "bg-green-500"
                        : i === wizardStep
                          ? "bg-violet-500"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {wizardWaiting && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="size-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Sharing to {currentWizardPlatform?.name}...
              </p>
            </div>
          )}

          {wizardPlatforms.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-lg font-bold text-green-400">All done!</p>
              <p className="text-sm text-muted-foreground">
                You&apos;re a marketing machine!
              </p>
              <Button
                className="mt-2"
                variant="outline"
                onClick={() => setWizardOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
