"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

type LedgerRow = {
  id: string;
  sourceType: string;
  sourceReference: string;
  divinerId: string | null;
  divinerUserId: string | null;
  divinerName: string;
  divinerUsername: string | null;
  grossAmount: number;
  platformFee: number;
  affiliateCommission: number;
  divinerNet: number;
  refundedGrossAmount: number;
  refundedAffiliateCommission: number;
  refundedDivinerNet: number;
  settlementStatus: string;
  settlementNote: string | null;
  recognizedAt: string;
  updatedAt: string;
  latestNote: {
    id: string;
    noteType: string;
    note: string;
    status: string;
    createdAt: string;
  } | null;
  notesCount: number;
};

const STATUSES = ["all", "pending", "approved", "held", "paid", "reversed", "disputed"] as const;
const NOTE_TYPES = ["general", "payout_hold", "refund_investigation", "manual_adjustment", "affiliate_dispute"] as const;

export default function FinanceOpsPage() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { settlementStatus: string; settlementNote: string; noteType: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(`/api/admin/finance/ledger?${params.toString()}`);
    const data = (await res.json().catch(() => ({}))) as { rows?: LedgerRow[]; error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Failed to load finance ops data");
      setRows([]);
    } else {
      setRows(data.rows ?? []);
    }
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function saveRow(row: LedgerRow) {
    const draft = drafts[row.id] ?? {
      settlementStatus: row.settlementStatus,
      settlementNote: row.settlementNote ?? "",
      noteType: row.latestNote?.noteType ?? "general",
    };
    setSavingId(row.id);
    const res = await fetch(`/api/admin/finance/ledger/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save ledger status");
    } else {
      toast.success("Finance ops updated.");
      await load();
    }
    setSavingId(null);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance Ops</h1>
        <p className="text-sm text-muted-foreground">
          Review revenue ledger entries, payout review state, and operations notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search diviner or order reference"
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as (typeof STATUSES)[number])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Loading finance ops entries...
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No finance ledger rows matched this filter.
            </CardContent>
          </Card>
        ) : (
          rows.map((row) => {
            const draft = drafts[row.id] ?? {
              settlementStatus: row.settlementStatus,
              settlementNote: row.settlementNote ?? "",
              noteType: row.latestNote?.noteType ?? "general",
            };
            return (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {row.divinerName}
                        {row.divinerUsername ? ` (@${row.divinerUsername})` : ""}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {row.sourceType.replaceAll("_", " ")} • {row.sourceReference} •{" "}
                        {new Date(row.recognizedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{row.settlementStatus}</Badge>
                      {row.refundedGrossAmount > 0 ? (
                        <Badge variant="secondary">
                          Refunded {formatCurrency(row.refundedGrossAmount)}
                        </Badge>
                      ) : null}
                      <Badge variant="secondary">{row.notesCount} notes</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Gross</p>
                      <p className="font-medium">{formatCurrency(row.grossAmount)}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Platform</p>
                      <p className="font-medium">{formatCurrency(row.platformFee)}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Affiliate</p>
                      <p className="font-medium">{formatCurrency(row.affiliateCommission)}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Diviner Net</p>
                      <p className="font-medium">{formatCurrency(row.divinerNet)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Remaining Gross</p>
                      <p className="font-medium">
                        {formatCurrency(row.grossAmount - row.refundedGrossAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Remaining Affiliate</p>
                      <p className="font-medium">
                        {formatCurrency(row.affiliateCommission - row.refundedAffiliateCommission)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Remaining Diviner Net</p>
                      <p className="font-medium">
                        {formatCurrency(row.divinerNet - row.refundedDivinerNet)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[180px_220px_1fr_auto]">
                    <Select
                      value={draft.settlementStatus}
                      onValueChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.id]: { ...draft, settlementStatus: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Settlement status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.filter((option) => option !== "all").map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={draft.noteType}
                      onValueChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.id]: { ...draft, noteType: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Note type" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Textarea
                      rows={2}
                      placeholder="Ops note, hold reason, dispute summary, or reconciliation context"
                      value={draft.settlementNote}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.id]: { ...draft, settlementNote: event.target.value },
                        }))
                      }
                    />

                    <Button onClick={() => saveRow(row)} disabled={savingId === row.id}>
                      {savingId === row.id ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 size-4" />
                      )}
                      Save
                    </Button>
                  </div>

                  {row.latestNote ? (
                    <div className="rounded-lg border border-dashed p-3 text-sm">
                      <p className="font-medium">
                        Latest note: {row.latestNote.noteType} • {row.latestNote.status}
                      </p>
                      <p className="mt-1 text-muted-foreground">{row.latestNote.note}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
