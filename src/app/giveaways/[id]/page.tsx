import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { GiveawayEntryForm } from "@/components/public/giveaway-entry-form";

export const dynamic = "force-dynamic";

async function getGiveaway(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("giveaways")
    .select(
      "id, title, description, prize_description, status, is_public, entry_fields, max_entries, ends_at"
    )
    .eq("id", id)
    .eq("status", "active")
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function getEntryCount(giveawayId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("giveaway_entries")
    .select("id", { count: "exact", head: true })
    .eq("giveaway_id", giveawayId);
  return count ?? 0;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const giveaway = await getGiveaway(id);
  if (!giveaway) return { title: "Giveaway Not Found" };
  return { title: giveaway.title };
}

function formatEndsAt(endsAt: string): string {
  return new Date(endsAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function GiveawayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const giveaway = await getGiveaway(id);
  if (!giveaway) notFound();

  const entryCount = giveaway.max_entries ? await getEntryCount(id) : null;
  const spotsRemaining =
    giveaway.max_entries !== null && entryCount !== null
      ? Math.max(0, giveaway.max_entries - entryCount)
      : null;

  const entryFields: string[] = Array.isArray(giveaway.entry_fields)
    ? (giveaway.entry_fields as string[])
    : ["name", "email"];

  return (
    <main className="min-h-screen bg-[#06080f] text-[#f5f0e8]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
            Giveaway
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {giveaway.title}
          </h1>
        </div>

        {/* Prize card */}
        <div className="mb-8 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-6 py-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#c9a84c]">
            Prize
          </p>
          <p className="text-lg font-medium">{giveaway.prize_description}</p>
        </div>

        {/* Description */}
        {giveaway.description && (
          <div className="mb-8">
            <p className="text-[#f5f0e8]/70 leading-relaxed">{giveaway.description}</p>
          </div>
        )}

        {/* Meta row */}
        <div className="mb-8 flex flex-wrap gap-4 text-sm text-[#f5f0e8]/60">
          {giveaway.ends_at && (
            <span>
              Ends{" "}
              <span className="text-[#f5f0e8]/80 font-medium">
                {formatEndsAt(giveaway.ends_at)}
              </span>
            </span>
          )}
          {spotsRemaining !== null && (
            <span>
              <span className="text-[#f5f0e8]/80 font-medium">{spotsRemaining}</span>
              {" / "}
              {giveaway.max_entries} spots remaining
            </span>
          )}
        </div>

        {/* Entry form */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold">Enter the Giveaway</h2>
          <GiveawayEntryForm
            giveawayId={giveaway.id}
            entryFields={entryFields}
          />
        </div>
      </div>
    </main>
  );
}
