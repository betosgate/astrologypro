"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Eye, EyeOff, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin-only "Call PIN" card.
 *
 * Renders in two states:
 *   - No PIN on the booking → info message.
 *   - PIN on the booking    → masked by default; an explicit "Reveal PIN"
 *                             button hits `GET /api/admin/bookings/[id]/pin`,
 *                             which writes an `admin.booking.pin_viewed`
 *                             activity_log entry. That way we have a real
 *                             audit trail of who-viewed-whose-PIN, instead
 *                             of logging "someone loaded the booking page".
 *
 * The parent (server component) only passes in `generatedAt` (and a boolean
 * via `hasPin`) so the PIN itself never ships in the HTML payload unless the
 * admin explicitly clicks reveal.
 */
export function CallPinCard({
  bookingId,
  hasPin,
  generatedAt,
}: {
  bookingId: string;
  hasPin: boolean;
  generatedAt: string | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    if (pin) {
      // already fetched — just re-show
      setRevealed(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/pin`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.detail ?? body?.title ?? "Failed to load PIN");
        return;
      }
      const body = (await res.json()) as { call_pin: string | null };
      if (!body.call_pin) {
        toast.error("No PIN found for this booking");
        return;
      }
      setPin(body.call_pin);
      setRevealed(true);
    } catch (err) {
      console.error("CallPinCard reveal error:", err);
      toast.error("Failed to load PIN");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      toast.success("PIN copied to clipboard");
    } catch {
      toast.error("Could not copy PIN");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          Call PIN
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasPin ? (
          <p className="text-sm text-muted-foreground">
            No call PIN generated for this booking.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div
                className={
                  "font-mono text-2xl tracking-[0.4em] rounded-md border px-4 py-2 " +
                  (revealed && pin
                    ? "text-foreground bg-background"
                    : "text-muted-foreground bg-muted select-none")
                }
                aria-live="polite"
              >
                {revealed && pin ? pin : "• • • • • •"}
              </div>

              {!revealed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reveal}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Reveal PIN
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRevealed(false)}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </Button>
                  <Button variant="outline" size="sm" onClick={copy}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </>
              )}
            </div>

            {generatedAt && (
              <p className="text-xs text-muted-foreground">
                Generated {new Date(generatedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Revealing the PIN is audit-logged.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
