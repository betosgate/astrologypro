import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CancelSubscriptionButton } from "@/components/portal/cancel-subscription-button";
import { Rss } from "lucide-react";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";

export const metadata = {
  title: "My Subscriptions",
};

const statusBadgeClass: Record<string, string> = {
  active:   "bg-green-500/10 text-green-400 border-green-500/20",
  paused:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  past_due: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled:"bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const statusLabel: Record<string, string> = {
  active:   "Active",
  paused:   "Paused",
  past_due: "Past Due",
  cancelled:"Cancelled",
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface Subscription {
  id: string;
  subscription_type: string;
  status: string;
  amount_cents: number;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  diviners: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  weekly_subscription_products: {
    title: string;
    description: string | null;
  } | null;
}

export default async function PortalSubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const { data } = await supabase
    .from("client_subscriptions")
    .select(
      `id, subscription_type, status, amount_cents, current_period_end,
       cancelled_at, created_at,
       diviners(display_name, username, avatar_url),
       weekly_subscription_products(title, description)`
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const all = (data ?? []) as unknown as Subscription[];
  const active = all.filter((s) => s.status !== "cancelled");
  const past = all.filter((s) => s.status === "cancelled");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Manage your recurring subscriptions with diviners.
        </p>
      </div>

      {/* Active subscriptions */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Active Subscriptions</h2>
        {active.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-6 py-12 text-center">
            <Rss className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <p className="font-medium">No active subscriptions.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribe to a diviner&apos;s weekly updates to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                showCancel
              />
            ))}
          </div>
        )}
      </section>

      {/* Past subscriptions */}
      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-muted-foreground">
            Past Subscriptions
          </h2>
          <div className="space-y-3">
            {past.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} showCancel={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SubscriptionCard({
  subscription: sub,
  showCancel,
}: {
  subscription: Subscription;
  showCancel: boolean;
}) {
  const diviner = sub.diviners;
  const product = sub.weekly_subscription_products;
  const productName = product?.title ?? "Weekly Updates";
  const badgeClass = statusBadgeClass[sub.status] ?? statusBadgeClass.active;
  const label = statusLabel[sub.status] ?? sub.status;

  const nextBillingLabel = sub.current_period_end
    ? `Renews ${new Date(sub.current_period_end).toLocaleDateString("en-US", { dateStyle: "medium" })}`
    : null;

  const cancelledLabel = sub.cancelled_at
    ? `Cancelled ${new Date(sub.cancelled_at).toLocaleDateString("en-US", { dateStyle: "medium" })}`
    : null;
  const divinerAvatarUrl = getDivinerAvatarUrl(diviner?.avatar_url);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
          <Image
            src={divinerAvatarUrl}
            alt={diviner?.display_name ?? "Diviner"}
            width={40}
            height={40}
            className="size-10 object-cover"
          />
        </div>

        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{productName}</p>
          <p className="text-xs text-muted-foreground">
            with {diviner?.display_name ?? "Diviner"}
          </p>
          <p className="text-sm font-semibold">{formatCents(sub.amount_cents)}/month</p>
          {nextBillingLabel && (
            <p className="text-xs text-muted-foreground">{nextBillingLabel}</p>
          )}
          {cancelledLabel && (
            <p className="text-xs text-muted-foreground">{cancelledLabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:shrink-0 sm:flex-col sm:items-end sm:gap-2">
        <Badge variant="outline" className={`${badgeClass} text-xs`}>
          {label}
        </Badge>
        {showCancel && sub.status !== "cancelled" && (
          <CancelSubscriptionButton
            subscriptionId={sub.id}
            productName={productName}
            periodEnd={sub.current_period_end ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
