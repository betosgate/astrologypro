import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { ChartStudioClient } from "@/components/mundane/chart-studio-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChartStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_id?: string; chart_id?: string }>;
}) {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const sp = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chart Studio</h1>
        <p className="text-sm text-muted-foreground">
          Visualize and analyze mundane astrological charts
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="size-8 animate-spin text-amber-500" />
          </div>
        }
      >
        <ChartStudioClient
          initialEntityId={sp.entity_id}
          initialChartId={sp.chart_id}
        />
      </Suspense>
    </div>
  );
}
