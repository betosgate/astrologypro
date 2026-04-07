import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { SubscriptionsHub } from "@/components/dashboard/subscriptions-ui";

export const metadata = { title: "Weekly Subscriptions" };

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  // Load all data in parallel
  const [productResult, subscribersResult, deliveriesResult] = await Promise.all([
    admin
      .from("weekly_subscription_products")
      .select("id, title, description, price_cents, is_active")
      .eq("diviner_id", diviner.id)
      .maybeSingle(),

    admin
      .from("weekly_subscription_subscribers")
      .select("id, email, name, status, subscribed_at, cancelled_at")
      .eq("diviner_id", diviner.id)
      .order("subscribed_at", { ascending: false })
      .order("id", { ascending: false }),

    admin
      .from("weekly_subscription_deliveries")
      .select("id, subject, scheduled_for, sent_at, recipient_count, status")
      .eq("diviner_id", diviner.id)
      .order("scheduled_for", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  const product = productResult.data ?? null;
  const subscribers = subscribersResult.data ?? [];
  const deliveries = deliveriesResult.data ?? [];

  const activeSubscribers = subscribers.filter((s) => s.status === "active").length;
  const deliveriesSent = deliveries.filter((d) => d.status === "sent").length;
  const lastSent = deliveries.find((d) => d.status === "sent");
  const lastDeliveryAt = lastSent?.sent_at ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Mail className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Subscriptions</h1>
          <p className="text-muted-foreground text-sm">
            Manage your subscription product, subscribers, and weekly deliveries.
          </p>
        </div>
      </div>

      <SubscriptionsHub
        product={product}
        subscribers={subscribers}
        deliveries={deliveries}
        activeSubscribers={activeSubscribers}
        deliveriesSent={deliveriesSent}
        lastDeliveryAt={lastDeliveryAt}
      />
    </div>
  );
}
