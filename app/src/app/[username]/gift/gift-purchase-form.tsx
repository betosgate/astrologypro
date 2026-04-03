"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const PRESET_AMOUNTS = [50, 100, 150, 200];

interface GiftPurchaseFormProps {
  divinerId: string;
  divinerName: string;
  username: string;
}

export function GiftPurchaseForm({
  divinerId,
  divinerName,
  username,
}: GiftPurchaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  const amount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!amount || amount < 10) {
      toast.error("Please select or enter an amount of at least $10");
      return;
    }
    if (!purchaserName || !purchaserEmail) {
      toast.error("Please fill in your name and email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/gift/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divinerId,
          amount,
          purchaserName,
          purchaserEmail,
          recipientName: recipientName || undefined,
          recipientEmail: recipientEmail || undefined,
          message: message || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to purchase gift certificate");
        return;
      }

      toast.success("Gift certificate purchased successfully!");
      router.push(`/gift/${data.code}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-violet-200 dark:border-violet-800/40">
      <CardHeader>
        <CardTitle>Gift Certificate for {divinerName}</CardTitle>
        <CardDescription>
          Choose an amount and personalize your gift. The recipient will receive
          an email with a unique code to book a session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Amount</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={selectedAmount === preset ? "default" : "outline"}
                  className={
                    selectedAmount === preset
                      ? "bg-violet-600 hover:bg-violet-700"
                      : ""
                  }
                  onClick={() => {
                    setSelectedAmount(preset);
                    setCustomAmount("");
                  }}
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">or</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min="10"
                  step="0.01"
                  placeholder="Custom amount"
                  className="pl-7"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Purchaser Info */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Your Information</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaser-name">Your Name *</Label>
                <Input
                  id="purchaser-name"
                  required
                  value={purchaserName}
                  onChange={(e) => setPurchaserName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaser-email">Your Email *</Label>
                <Input
                  id="purchaser-email"
                  type="email"
                  required
                  value={purchaserEmail}
                  onChange={(e) => setPurchaserEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Recipient Information{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name</Label>
                <Input
                  id="recipient-name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
            </div>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="gift-message">
              Personal Message{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="gift-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a personal message for the recipient..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !amount || amount < 10}
            className="w-full bg-violet-600 hover:bg-violet-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Purchase Gift Certificate${amount ? ` - $${amount.toFixed(2)}` : ""}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
