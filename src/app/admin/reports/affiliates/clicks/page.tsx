"use client";

// /admin/reports/affiliates/clicks
// Paginated raw click log. Filters: country, is_bot, diviner_id,
// affiliate_id (junction id), date range. Cursor pagination.
//
// Spec: docs/specs/affiliate-commission-system.md §6.1, §6 pagination

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ReportsTabs } from "../_components/reports-tabs";

interface Click {
  id: string;
  campaign_id: string;
  campaign_code: string | null;
  diviner_id: string | null;
  destination_type: string | null;
  destination_id: string | null;
  affiliate_id: string | null;
  affiliate_type: string | null;
  ip: string | null;
  country: string | null;
  user_agent: string | null;
  referrer: string | null;
  is_bot: boolean;
  is_unique_click: boolean;
  created_at: string;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminReportsClicksPage() {
  const [country, setCountry] = useState("");
  const [divinerId, setDivinerId] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [isBot, setIsBot] = useState<"all" | "true" | "false">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState<Click[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams({ limit: "25" });
      if (country) params.set("country", country);
      if (divinerId) params.set("diviner_id", divinerId);
      if (affiliateId) params.set("affiliate_id", affiliateId);
      if (isBot === "true") params.set("is_bot", "true");
      else if (isBot === "false") params.set("is_bot", "false");
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (nextCursor) params.set("cursor", nextCursor);
      return `/api/admin/reports/affiliates/clicks?${params.toString()}`;
    },
    [country, divinerId, affiliateId, isBot, dateFrom, dateTo],
  );

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      if (res.ok) {
        const j = await res.json();
        setRows((j.data as Click[]) ?? []);
        setCursor(j.nextCursor ?? null);
        setHasMore(Boolean(j.hasMore));
      }
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(cursor));
      if (res.ok) {
        const j = await res.json();
        setRows((prev) => [...prev, ...((j.data as Click[]) ?? [])]);
        setCursor(j.nextCursor ?? null);
        setHasMore(Boolean(j.hasMore));
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Clicks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Raw click log. Filter by country, bot/human, diviner, affiliate
          (junction id), and date range.
        </p>
      </header>

      <ReportsTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              maxLength={2}
              placeholder="US"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="diviner-id">Diviner ID</Label>
            <Input
              id="diviner-id"
              placeholder="UUID"
              value={divinerId}
              onChange={(e) => setDivinerId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="affiliate-id">Affiliate ID (junction)</Label>
            <Input
              id="affiliate-id"
              placeholder="UUID"
              value={affiliateId}
              onChange={(e) => setAffiliateId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="is-bot">Bot vs human</Label>
            <Select
              value={isBot}
              onValueChange={(v) => setIsBot(v as "all" | "true" | "false")}
            >
              <SelectTrigger id="is-bot">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Humans only</SelectItem>
                <SelectItem value="true">Bots only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-from">From</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to">To</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end md:col-span-3 lg:col-span-6">
            <Button onClick={loadFirstPage} disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Click log</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No clicks match your filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Bot?</TableHead>
                      <TableHead>Unique?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {fmtDateTime(r.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.campaign_code ?? r.campaign_id}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.country ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.affiliate_id ?? "—"}
                        </TableCell>
                        <TableCell>
                          {r.is_bot ? (
                            <Badge variant="outline">bot</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              human
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.is_unique_click ? (
                            <Badge variant="default">unique</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              repeat
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
