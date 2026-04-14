import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Session Library",
};

export default async function SessionLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/onboarding");

  // Fetch all library data in parallel on the server
  const [recordingsRes, tarotRes, chartsRes, astroRes] = await Promise.all([
    admin
      .from("bookings")
      .select("id, scheduled_at, recording_url, recording_share_id, actual_duration_minutes, session_notes, services(name), clients(full_name, email)")
      .eq("diviner_id", diviner.id)
      .eq("status", "completed")
      .not("recording_url", "is", null)
      .order("scheduled_at", { ascending: false })
      .order("id", { ascending: false }),
    admin
      .from("tarot_readings")
      .select("id, user_id, diviner_id, spread_name, cards, notes, share_token, created_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
    admin
      .from("birth_chart_results")
      .select("id, user_id, diviner_id, city_label, birth_day, birth_month, birth_year, chart_url, created_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
    admin
      .from("astro_toolkit_readings")
      .select("id, user_id, diviner_id, reading_type, input_data, result_data, booking_id, created_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  // Resolve client names for tarot/chart/astro via user_id
  const readings = [
    ...(tarotRes.data ?? []),
    ...(chartsRes.data ?? []),
    ...(astroRes.data ?? []),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIds = [...new Set(readings.map((r: any) => r.user_id).filter(Boolean))];
  let clientMap: Record<string, { full_name: string; email: string }> = {};
  if (userIds.length > 0) {
    const { data: clientRows } = await admin
      .from("clients")
      .select("user_id, full_name, email")
      .in("user_id", userIds);
    for (const c of clientRows ?? []) {
      clientMap[c.user_id] = { full_name: c.full_name ?? "", email: c.email ?? "" };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function attachClient(rows: any[]) {
    return rows.map((row) => ({ ...row, client: clientMap[row.user_id] ?? null }));
  }

  const recordings = recordingsRes.data ?? [];
  const tarot = attachClient(tarotRes.data ?? []);
  const charts = attachClient(chartsRes.data ?? []);
  const astro = attachClient(astroRes.data ?? []);

  return (
    <LibraryClient
      recordings={recordings}
      tarot={tarot}
      charts={charts}
      astro={astro}
    />
  );
}
