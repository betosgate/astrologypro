import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Tarot Readings - AstrologyPro" };

export default async function CommunityTarotPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/get-started");
  if (member.membership_status !== "active") redirect("/join/community/resubscribe");

  // Fetch user's saved readings
  const { data: readings } = await supabase
    .from("tarot_readings")
    .select("id, spread_name, created_at, notes, share_token")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const hasReadings = readings && readings.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tarot Readings</h1>
          <p className="mt-1 text-muted-foreground">
            View your tarot card readings.
          </p>
        </div>
        {hasReadings && (
          <Button asChild variant="outline" size="sm">
            <Link href="/community/tarot/history">View All History</Link>
          </Button>
        )}
      </div>

      {hasReadings ? (
        <div className="space-y-3">
          {readings.map((r) => (
            <Link
              key={r.id}
              href={`/community/tarot/readings/${r.id}`}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{r.spread_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {r.notes && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{r.notes}</p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">View →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-muted-foreground/20 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-500/10">
            <Sparkles className="size-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">No readings yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your tarot card readings will appear here once a diviner creates a reading for you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
