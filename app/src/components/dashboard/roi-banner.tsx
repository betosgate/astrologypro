import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, Rocket, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoiBannerProps {
  monthlyRevenue: number; // in cents
  subscriptionCost?: number; // in dollars, default 149
}

export function RoiBanner({
  monthlyRevenue,
  subscriptionCost = 149,
}: RoiBannerProps) {
  const revenueInDollars = monthlyRevenue / 100;
  const roi = Math.round((revenueInDollars / subscriptionCost) * 10) / 10;

  if (revenueInDollars === 0) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
            <Rocket className="size-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Let&apos;s get your first booking!
            </p>
            <p className="text-xs text-muted-foreground">
              Share your page to start attracting clients
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/marketing">
            <Share2 className="mr-1.5 size-3.5" />
            Share your page
          </Link>
        </Button>
      </div>
    );
  }

  if (revenueInDollars < subscriptionCost) {
    const remaining = subscriptionCost - revenueInDollars;
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
            <TrendingUp className="size-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium">
              You earned {formatCurrency(revenueInDollars)} this month through
              AstrologyPro
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(remaining)} more to cover your subscription this
              month &mdash; you&apos;re getting there!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
          <TrendingUp className="size-5 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-medium">
            You earned {formatCurrency(revenueInDollars)} this month through
            AstrologyPro
          </p>
          <p className="text-xs text-muted-foreground">
            That&apos;s a {roi}:1 return on your ${subscriptionCost}{" "}
            subscription! {"\uD83C\uDF89"}
          </p>
        </div>
      </div>
    </div>
  );
}
