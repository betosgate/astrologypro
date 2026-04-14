import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Upload, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type ImportRecord = {
  id: string;
  import_type: string;
  file_name: string | null;
  status: string;
  total_rows: number;
  imported_rows: number;
  error_rows: number;
  created_at: string;
  completed_at: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  processing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_LABEL: Record<string, string> = {
  csv_events: "Events",
  csv_entities: "Entities",
  csv_leaders: "Leaders",
  csv_forecasts: "Forecasts",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminMundaneImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from("mundane_imports")
    .select(
      "id, import_type, file_name, status, total_rows, imported_rows, error_rows, created_at, completed_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load imports: {error.message}
      </div>
    );
  }

  const imports = (data ?? []) as ImportRecord[];
  const total = count ?? 0;
  const hasMore = offset + limit < total;
  const hasPrev = page > 1;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Upload className="size-6 text-cyan-500" />
            CSV Imports
          </h1>
          <p className="text-muted-foreground">
            Import events, entities, leaders, and forecasts from CSV files.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/imports/new">
            <Plus className="mr-1.5 size-4" /> New Import
          </Link>
        </Button>
      </div>

      {imports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Upload className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No imports yet</p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/imports/new">
                <Plus className="mr-1.5 size-4" /> New Import
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">File</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Imported / Total
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Errors</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {imports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABEL[imp.import_type] ?? imp.import_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                      {imp.file_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${STATUS_BADGE[imp.status] ?? ""}`}
                      >
                        {imp.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {imp.status === "completed" || imp.status === "failed"
                        ? `${imp.imported_rows} / ${imp.total_rows}`
                        : `— / ${imp.total_rows}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {imp.error_rows > 0 ? (
                        <span className="text-red-600">{imp.error_rows}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                      {formatDate(imp.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(hasPrev || hasMore) && (
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              {hasPrev && (
                <Link href={`/admin/mundane/imports?page=${page - 1}`}>
                  <Button variant="outline" size="sm">Previous</Button>
                </Link>
              )}
              <span>Page {page} of {Math.ceil(total / limit)}</span>
              {hasMore && (
                <Link href={`/admin/mundane/imports?page=${page + 1}`}>
                  <Button variant="outline" size="sm">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
