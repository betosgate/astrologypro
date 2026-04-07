import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers, Star, Wrench } from "lucide-react";
import { DivinerReadingsClient } from "@/components/dashboard/diviner-readings-client";
import type { InitialData } from "@/components/dashboard/diviner-readings-client";

export const metadata = {
  title: "Reading Reports - Dashboard",
};

export default async function ReadingReportsPage() {
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

  // Fetch counts + first page for all 3 tabs in parallel (7 queries total)
  const [
    tarotCountRes,
    birthChartCountRes,
    astroCountRes,
    tarotFirstPage,
    birthChartFirstPage,
    astroFirstPage,
  ] = await Promise.all([
    // Total counts (no data, just count)
    admin
      .from("tarot_readings")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id),
    admin
      .from("birth_chart_results")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id),
    admin
      .from("astro_toolkit_readings")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id),
    // First page for each tab (25 rows + 1 to detect hasMore)
    admin
      .from("tarot_readings")
      .select("id, user_id, diviner_id, spread_name, cards, notes, created_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(26),
    admin
      .from("birth_chart_results")
      .select(
        "id, user_id, diviner_id, city_label, birth_day, birth_month, birth_year, created_at"
      )
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(26),
    admin
      .from("astro_toolkit_readings")
      .select(
        "id, user_id, diviner_id, reading_type, input_data, result_data, created_at"
      )
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(26),
  ]);

  const tarotCount = tarotCountRes.count ?? 0;
  const birthChartCount = birthChartCountRes.count ?? 0;
  const astroCount = astroCountRes.count ?? 0;

  function slicePage<T extends { created_at: string; id: string }>(
    rows: T[] | null
  ): { readings: T[]; nextCursor: string | null; hasMore: boolean } {
    const data = rows ?? [];
    const hasMore = data.length > 25;
    const items = hasMore ? data.slice(0, 25) : data;
    const nextCursor =
      hasMore && items.length > 0
        ? `${items[items.length - 1].created_at}:${items[items.length - 1].id}`
        : null;
    return { readings: items, nextCursor, hasMore };
  }

  const initialData: InitialData = {
    tarot: slicePage(tarotFirstPage.data as any),
    birth_chart: slicePage(birthChartFirstPage.data as any),
    astro_toolkit: slicePage(astroFirstPage.data as any),
  };

  const counts = {
    tarot: tarotCount,
    birth_chart: birthChartCount,
    astro_toolkit: astroCount,
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f0e8]">
          Reading Reports
        </h1>
        <p className="text-[#f5f0e8]/60">
          All readings you have conducted — tarot, birth charts, and astro
          toolkit sessions.
        </p>
      </div>

      {/* Summary stat row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Tarot Readings
            </CardTitle>
            <Star className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {tarotCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">linked to your account</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Birth Charts
            </CardTitle>
            <Layers className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {birthChartCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">linked to your account</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f0e8]/80">
              Astro Toolkit
            </CardTitle>
            <Wrench className="size-4 text-[#c9a84c]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f0e8]">
              {astroCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f0e8]/40">linked to your account</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed readings client component */}
      <DivinerReadingsClient initialData={initialData} counts={counts} />
    </div>
  );
}
