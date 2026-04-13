import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Portal Settings",
};

export default async function PortalSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your recurring subscriptions and where AstrologyPro emails are sent.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-base font-semibold">Subscriptions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review active weekly updates, renewals, and cancellations in one place.
        </p>
        <Link
          href="/portal/subscriptions"
          className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[#c9a84c] hover:text-[#f1d998]"
        >
          Open subscriptions
        </Link>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-base font-semibold">Email delivery</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Weekly subscription emails can be paused from the secure link inside each message, even if you are not signed in.
        </p>
      </section>
    </div>
  );
}
