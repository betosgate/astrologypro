import { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReadingsReportClient } from "@/components/admin/readings-report-client";

export const metadata: Metadata = {
  title: "Reading History | AstrologyPro Admin",
};

export const dynamic = "force-dynamic";

// ─── Initial parallel fetch ───────────────────────────────────────────────────

async function fetchInitialTab(tab: "tarot" | "birth_chart" | "astro_toolkit") {
  const admin = createAdminClient();
  const LIMIT = 25;

  if (tab === "tarot") {
    const { data, error } = await admin
      .from("tarot_readings")
      .select("id, user_id, spread_name, cards, notes, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(LIMIT + 1);

    if (error || !data) return { items: [], next_cursor: null };

    const hasMore = data.length > LIMIT;
    const page = hasMore ? data.slice(0, LIMIT) : data;

    // Resolve emails
    const userIds = [...new Set(page.map((r) => r.user_id))];
    const emailMap = await resolveEmails(userIds);

    const items = page.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      user_email: emailMap.get(r.user_id) ?? null,
      spread_name: r.spread_name ?? null,
      cards_count: Array.isArray(r.cards) ? (r.cards as unknown[]).length : 0,
      notes: r.notes ?? null,
      created_at: r.created_at,
    }));

    return {
      items,
      next_cursor: hasMore ? page[page.length - 1].created_at : null,
    };
  }

  if (tab === "birth_chart") {
    const { data, error } = await admin
      .from("birth_chart_results")
      .select("id, user_id, city_label, birth_day, birth_month, birth_year, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(LIMIT + 1);

    if (error || !data) return { items: [], next_cursor: null };

    const hasMore = data.length > LIMIT;
    const page = hasMore ? data.slice(0, LIMIT) : data;

    const userIds = [...new Set(page.map((r) => r.user_id))];
    const emailMap = await resolveEmails(userIds);

    const items = page.map((r) => {
      const day = r.birth_day ?? "?";
      const month = r.birth_month ?? "?";
      const year = r.birth_year ?? "?";
      return {
        id: r.id,
        user_id: r.user_id,
        user_email: emailMap.get(r.user_id) ?? null,
        city_label: r.city_label ?? null,
        birth_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        created_at: r.created_at,
      };
    });

    return {
      items,
      next_cursor: hasMore ? page[page.length - 1].created_at : null,
    };
  }

  // astro_toolkit
  const { data, error } = await admin
    .from("astro_toolkit_readings")
    .select("id, user_id, reading_type, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIMIT + 1);

  if (error || !data) return { items: [], next_cursor: null };

  const hasMore = data.length > LIMIT;
  const page = hasMore ? data.slice(0, LIMIT) : data;

  const userIds = [...new Set(page.map((r) => r.user_id))];
  const emailMap = await resolveEmails(userIds);

  const items = page.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    user_email: emailMap.get(r.user_id) ?? null,
    reading_type: r.reading_type ?? null,
    created_at: r.created_at,
  }));

  return {
    items,
    next_cursor: hasMore ? page[page.length - 1].created_at : null,
  };
}

async function resolveEmails(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error || !data) return map;

  for (const u of data.users) {
    if (userIds.includes(u.id)) {
      map.set(u.id, u.email ?? "");
    }
  }
  return map;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReadingsReportPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  // Fetch all three tabs in parallel
  const [initialTarot, initialBirthChart, initialAstroToolkit] =
    await Promise.all([
      fetchInitialTab("tarot"),
      fetchInitialTab("birth_chart"),
      fetchInitialTab("astro_toolkit"),
    ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f5f0e8" }}
        >
          Reading History
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
          Browse and search all user readings across Tarot, Birth Charts, and
          the Astro Toolkit.
        </p>
      </div>

      <ReadingsReportClient
        initialTarot={initialTarot}
        initialBirthChart={initialBirthChart}
        initialAstroToolkit={initialAstroToolkit}
      />
    </div>
  );
}
