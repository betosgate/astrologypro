"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Rocket } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { VercelDeploymentsReportResponse } from "@/app/api/admin/reports/vercel-deployments/route";

const PAGE_SIZE = 10;

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  READY: "default",
  ERROR: "destructive",
  CANCELED: "secondary",
  BUILDING: "outline",
  QUEUED: "outline",
  INITIALIZING: "outline",
};

export default function VercelDeploymentsReportPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VercelDeploymentsReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/vercel-deployments?page=${page}&pageSize=${PAGE_SIZE}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData(body as VercelDeploymentsReportResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deployments.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vercel Deployments</h1>
        <p className="text-sm text-muted-foreground">
          Latest 50 deployments for the linked Vercel project, paginated for admin review.
        </p>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error && !data ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={load}>Retry</Button>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Loaded Window" value={`${data.pagination.totalItems}`} hint="Last 50 max" />
            <SummaryCard label="Current Page" value={`${data.pagination.page}`} hint={`of ${data.pagination.totalPages}`} />
            <SummaryCard label="Page Size" value={`${data.pagination.pageSize}`} hint="deployments" />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Updating...
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Deployment List</CardTitle>
            </CardHeader>
            <CardContent>
              {data.items.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No deployments found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Ready</TableHead>
                      <TableHead>Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[item.status] ?? "outline"}>{item.status}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{item.environment}</TableCell>
                        <TableCell>
                          <div>{item.branch ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.commitSha ? item.commitSha.slice(0, 10) : ""}
                          </div>
                        </TableCell>
                        <TableCell>{item.creator}</TableCell>
                        <TableCell>{formatDateTime(new Date(item.createdAt))}</TableCell>
                        <TableCell>{item.readyAt ? formatDateTime(new Date(item.readyAt)) : "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {item.url ? (
                              <Button asChild size="sm" variant="outline">
                                <Link href={item.url} target="_blank" rel="noreferrer">
                                  Open
                                  <ExternalLink className="size-3.5" />
                                </Link>
                              </Button>
                            ) : null}
                            {item.inspectorUrl ? (
                              <Button asChild size="sm" variant="ghost">
                                <Link href={item.inspectorUrl} target="_blank" rel="noreferrer">
                                  Inspect
                                  <Rocket className="size-3.5" />
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {data.pagination.page} of {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={!data.pagination.hasPreviousPage || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((value) => value + 1)}
                disabled={!data.pagination.hasNextPage || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
