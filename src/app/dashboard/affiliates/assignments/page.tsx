"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Users,
  User,
  BookOpen,
  Search,
  Ban,
  MousePointerClick,
  TrendingUp,
  DollarSign,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Assignment {
  id: string;
  destination_type: "PROFILE" | "SERVICE";
  destination_id: string | null;
  destination_name: string;
  affiliate_id: string;
  affiliate_type: "diviner_affiliate" | "social_advocate";
  affiliate_name: string;
  affiliate_email: string | null;
  commission_type: "percent" | "flat";
  commission_value: number;
  is_active: boolean;
  assigned_at: string;
  revoked_at: string | null;
  notes: string | null;
  kpis_30d: {
    clicks: number;
    unique_clicks: number;
    conversions: number;
    commission_cents: number;
  };
}

interface AffiliateSearchResult {
  id: string;
  name: string;
  email: string;
  affiliate_type: "diviner_advocate" | "social_advocate" | "diviner_affiliate";
  already_assigned_to_scope: boolean;
}

interface ServiceDestination {
  id: string;
  template_name: string;
  category: string;
  price: number;
  is_published: boolean;
}

interface DestinationOptions {
  profile: { id: string };
  services: ServiceDestination[];
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtCommission(type: "percent" | "flat", value: number) {
  return type === "percent" ? `${value}%` : `$${value.toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function AffiliateAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<"affiliate" | "service">("affiliate");
  const [showInactive, setShowInactive] = useState(false);
  const [revokeAssignment, setRevokeAssignment] = useState<Assignment | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/affiliate-assignments");
      if (res.ok) {
        const json = await res.json();
        setAssignments((json.assignments ?? []) as Assignment[]);
      } else {
        toast.error("Failed to load assignments");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRevoke(id: string) {
    setRevoking(true);
    try {
      const res = await fetch(`/api/dashboard/affiliate-assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      if (res.ok) {
        toast.success("Assignment revoked");
        setRevokeAssignment(null);
        await load();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Failed to revoke");
      }
    } finally {
      setRevoking(false);
    }
  }

  const filtered = showInactive
    ? assignments
    : assignments.filter((a) => a.is_active);

  // Grouping
  const groups = groupRows(filtered, groupBy);

  return (
    <div className="space-y-6 pb-16">
      <ConfirmDialog
        open={!!revokeAssignment}
        title="Revoke Assignment"
        description="Revoke this assignment? Affiliate campaigns pointing at this destination will be auto-paused."
        confirmLabel="Revoke"
        loading={revoking}
        variant="destructive"
        onOpenChange={(open) => {
          if (!open && !revoking) setRevokeAssignment(null);
        }}
        onConfirm={() => {
          if (revokeAssignment) void handleRevoke(revokeAssignment.id);
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/affiliates">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Affiliate Assignments</h1>
            <p className="text-xs text-muted-foreground">
              Assign affiliates to your profile or specific services. Commission is locked at assignment time.
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <CreateAssignmentDialog
            onCreated={() => {
              setCreateOpen(false);
              load();
            }}
          />
        </Dialog>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border">
          <button
            onClick={() => setGroupBy("affiliate")}
            className={`px-3 py-1 text-xs ${groupBy === "affiliate" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            By Affiliate
          </button>
          <button
            onClick={() => setGroupBy("service")}
            className={`px-3 py-1 text-xs ${groupBy === "service" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            By Destination
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show revoked
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Loading assignments…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Users className="size-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium">No assignments yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Assign an affiliate to your profile or a specific service. The affiliate
              will then be able to create campaigns that drive traffic and earn
              commission at the rate you set.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {groupBy === "affiliate" ? (
                    <User className="size-4 text-muted-foreground" />
                  ) : g.key === "PROFILE" ? (
                    <User className="size-4 text-muted-foreground" />
                  ) : (
                    <BookOpen className="size-4 text-muted-foreground" />
                  )}
                  {g.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {g.rows.length} assignment{g.rows.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{groupBy === "affiliate" ? "Scope" : "Affiliate"}</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead className="text-right">Clicks (30d)</TableHead>
                        <TableHead className="text-right">Conv. (30d)</TableHead>
                        <TableHead className="text-right">Commission (30d)</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/dashboard/affiliates/assignments/${r.id}`}
                              className="hover:underline"
                            >
                              {groupBy === "affiliate" ? r.destination_name : r.affiliate_name}
                            </Link>
                            <p className="text-[10px] text-muted-foreground">
                              {groupBy === "affiliate"
                                ? r.destination_type
                                : r.affiliate_email ?? ""}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {fmtCommission(r.commission_type, r.commission_value)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {r.kpis_30d.clicks}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {r.kpis_30d.conversions}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {fmtCents(r.kpis_30d.commission_cents)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {fmtDate(r.assigned_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.is_active ? "default" : "secondary"}>
                              {r.is_active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-destructive hover:text-destructive"
                                onClick={() => setRevokeAssignment(r)}
                                title="Revoke"
                              >
                                <Ban className="size-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Group rows by affiliate or destination
function groupRows(rows: Assignment[], by: "affiliate" | "service") {
  const map = new Map<string, { key: string; title: string; rows: Assignment[] }>();
  for (const r of rows) {
    const key = by === "affiliate" ? `${r.affiliate_type}:${r.affiliate_id}` : `${r.destination_type}:${r.destination_id ?? ""}`;
    const title =
      by === "affiliate"
        ? `${r.affiliate_name} (${r.affiliate_type === "social_advocate" ? "Advocate" : "Affiliate"})`
        : r.destination_name;
    if (!map.has(key)) map.set(key, { key, title, rows: [] });
    map.get(key)!.rows.push(r);
  }
  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
}

// ─── Create dialog ─────────────────────────────────────────────────────────
function CreateAssignmentDialog({ onCreated }: { onCreated: () => void }) {
  const [scope, setScope] = useState<"PROFILE" | "SERVICE">("PROFILE");
  const [destinations, setDestinations] = useState<ServiceDestination[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [commissionType, setCommissionType] = useState<"percent" | "flat">("percent");
  const [commissionValue, setCommissionValue] = useState("10");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Affiliate search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AffiliateSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AffiliateSearchResult | null>(null);

  useEffect(() => {
    // Load destinations once
    fetch("/api/dashboard/campaigns/destinations")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json: DestinationOptions) => setDestinations(json.services ?? []))
      .catch(() => {});
  }, []);

  // Debounced affiliate search
  useEffect(() => {
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    params.set("exclude_scope", scope);
    if (scope === "SERVICE" && serviceId) params.set("exclude_destination_id", serviceId);
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/dashboard/affiliates/search?${params}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.affiliates ?? []);
        }
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, scope, serviceId]);

  async function handleCreate() {
    if (!selected) {
      toast.error("Select an affiliate first");
      return;
    }
    if (scope === "SERVICE" && !serviceId) {
      toast.error("Pick a service");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/affiliate-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_type: scope,
          destination_id: scope === "SERVICE" ? serviceId : null,
          affiliate_id: selected.id,
          affiliate_type: selected.affiliate_type,
          commission_type: commissionType,
          commission_value: parseFloat(commissionValue) || 0,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        toast.success("Assignment created");
        onCreated();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Failed to create assignment");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>New Affiliate Assignment</DialogTitle>
        <DialogDescription>
          Assign an affiliate to your profile or a specific service, with a pre-defined commission.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Scope</Label>
          <div className="flex rounded-md border">
            <button
              onClick={() => setScope("PROFILE")}
              className={`flex-1 px-3 py-2 text-sm ${scope === "PROFILE" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <User className="inline mr-1.5 size-3.5" />
              Profile
            </button>
            <button
              onClick={() => setScope("SERVICE")}
              className={`flex-1 px-3 py-2 text-sm ${scope === "SERVICE" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <BookOpen className="inline mr-1.5 size-3.5" />
              Service
            </button>
          </div>
        </div>

        {scope === "SERVICE" && (
          <div className="space-y-2">
            <Label>Service</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={serviceId ?? ""}
              onChange={(e) => setServiceId(e.target.value || null)}
            >
              <option value="">— pick a service —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.template_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Affiliate</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder={selected ? selected.name : "Search by name or email…"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selected) setSelected(null);
              }}
              className="pl-8"
            />
          </div>
          {query.trim().length > 0 || results.length > 0 ? (
            <div className="max-h-48 overflow-auto rounded-md border divide-y">
              {searching && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="inline mr-1.5 size-3 animate-spin" />
                  Searching…
                </div>
              )}
              {!searching && results.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No affiliates found.
                </div>
              )}
              {!searching &&
                results.map((r) => (
                  <button
                    key={`${r.affiliate_type}-${r.id}`}
                    type="button"
                    disabled={r.already_assigned_to_scope}
                    onClick={() => {
                      setSelected(r);
                      setQuery("");
                      setResults([]);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      r.already_assigned_to_scope
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {r.affiliate_type === "social_advocate" ? "Advocate" : "Affiliate"}
                        </Badge>
                        {r.already_assigned_to_scope && (
                          <Badge variant="secondary" className="text-[10px]">
                            Already assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          ) : null}
          {selected && (
            <div className="rounded-md border bg-muted/30 p-2.5 text-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{selected.name}</p>
                <p className="text-[10px] text-muted-foreground">{selected.email}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {selected.affiliate_type === "social_advocate" ? "Advocate" : "Affiliate"}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Commission Type</Label>
            <div className="flex rounded-md border">
              <button
                onClick={() => setCommissionType("percent")}
                className={`flex-1 px-3 py-2 text-xs ${commissionType === "percent" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Percent
              </button>
              <button
                onClick={() => setCommissionType("flat")}
                className={`flex-1 px-3 py-2 text-xs ${commissionType === "flat" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Flat
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{commissionType === "percent" ? "Commission %" : "Amount ($)"}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes (private to you)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional — not shown to the affiliate."
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate} disabled={saving || !selected}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Assignment
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
