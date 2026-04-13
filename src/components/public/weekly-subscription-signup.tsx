"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { Loader2, Mail } from "lucide-react";

interface WeeklySubscriptionSignupProps {
  divinerUsername: string;
  productTitle: string;
  description?: string | null;
  priceCents: number;
}

export function WeeklySubscriptionSignup({
  divinerUsername,
  productTitle,
  description,
  priceCents,
}: WeeklySubscriptionSignupProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const affiliateCode = params.get("ref") ?? undefined;

      const res = await fetch("/api/stripe/weekly-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divinerUsername,
          email,
          name,
          affiliateCode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Mail className="size-5" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-cream">
            {productTitle}
          </h3>
          <p className="text-sm text-silver/70">
            {formatCurrency(priceCents / 100)} / month
          </p>
        </div>
      </div>

      {description && (
        <p className="mb-5 text-sm leading-6 text-silver/75">{description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weekly-name" className="text-silver/80">
            Full Name
          </Label>
          <Input
            id="weekly-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="border-white/10 bg-cosmos-950/70"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekly-email" className="text-silver/80">
            Email
          </Label>
          <Input
            id="weekly-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border-white/10 bg-cosmos-950/70"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Button
        className="mt-5 w-full gap-2 bg-gold text-cosmos-950 hover:bg-gold-light"
        disabled={loading || !email.trim() || !name.trim()}
        onClick={handleCheckout}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Redirecting to checkout...
          </>
        ) : (
          `Subscribe for ${formatCurrency(priceCents / 100)}/month`
        )}
      </Button>
    </div>
  );
}
