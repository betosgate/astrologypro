import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWeeklySubscriptionManageToken } from "@/lib/weekly-subscription-manage-token";
import { ManageSubscriptionClient } from "./manage-subscription-client";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

async function ManageSubscriptionContent({ searchParams }: PageProps) {
  const { token = "" } = await searchParams;
  const verified = verifyWeeklySubscriptionManageToken(token);
  if (!verified.valid || !verified.subscriberId || !verified.email) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: subscriber } = await admin
    .from("weekly_subscription_subscribers")
    .select(
      "id, email, name, status, current_period_end, email_opt_out, weekly_subscription_products(title), diviners(display_name, username)",
    )
    .eq("id", verified.subscriberId)
    .eq("email", verified.email)
    .maybeSingle();

  if (!subscriber) {
    notFound();
  }

  const productTitle =
    (subscriber.weekly_subscription_products as { title?: string } | null)?.title ??
    "Weekly Updates";
  const diviner =
    (subscriber.diviners as { display_name?: string | null; username?: string | null } | null)
      ?.display_name ?? "your diviner";
  const periodEndLabel = subscriber.current_period_end
    ? new Date(subscriber.current_period_end).toLocaleDateString("en-US", {
        dateStyle: "long",
      })
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_35%),linear-gradient(180deg,#090816,#05040d)] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c9a84c]">
            AstrologyPro Subscription Center
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">{productTitle}</h1>
          <p className="mx-auto max-w-2xl text-sm text-zinc-300 sm:text-base">
            Manage your weekly update subscription from {diviner} without signing in.
          </p>
        </div>

        <ManageSubscriptionClient
          token={token}
          initialCancelled={subscriber.status === "cancelled"}
          initialEmailOptOut={Boolean(subscriber.email_opt_out)}
          periodEndLabel={periodEndLabel}
        />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          <p className="font-medium text-white">Prefer the full client portal?</p>
          <p className="mt-2">
            You can also manage recurring purchases, orders, and recordings from your client account.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login?redirect=%2Fportal%2Fsubscriptions"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[#c9a84c] hover:text-[#f1d998]"
            >
              Open client portal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ManageSubscriptionPage(props: PageProps) {
  return (
    <Suspense>
      <ManageSubscriptionContent {...props} />
    </Suspense>
  );
}
