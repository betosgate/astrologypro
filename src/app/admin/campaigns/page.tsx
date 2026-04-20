"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Users,
  Target,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  FilterX,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CampaignDestinationBadge } from "@/components/dashboard/campaign-destination-badge";
import {
  AdminPagination,
  AdminTableSearch,
  AdminResetButton,
  AdminDivinerAutocomplete,
  SortHeader,
  useAdminTableParams,
} from "@/components/admin/admin-table-parts";

interface Campaign {
  id: string;
  diviner_id: string | null;
  diviner_name: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  commission_type: string;
  commission_value: number;
  budget_cap_cents: number | null;
  spent_cents: number;
  target_product_type: string | null;
  affiliates_count: number;
  conversions_count: number;
  created_at: string;
  destination_type: "PROFILE" | "SERVICE" | null;
  campaign_code: string | null;
  share_url: string | null;
  auto_paused_at: string | null;
  auto_pause_reason: string | null;
}

interface Diviner {
  id: string;
  display_name: string;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "default",
  expired: "destructive",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function AdminCampaignsPage() {
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "start_date", dir: "desc" });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterDiviner, setFilterDiviner] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formCommType, setFormCommType] = useState("percentage");
  const [formCommValue, setFormCommValue] = useState("10");
  const [formBudgetCap, setFormBudgetCap] = useState("");
  const [formTargetProduct, setFormTargetProduct] = useState("");
  const [formUtmSource, setFormUtmSource] = useState("");
  const [formUtmMedium, setFormUtmMedium] = useState("");
  const [formUtmCampaign, setFormUtmCampaign] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editCommType, setEditCommType] = useState("");
  const [editCommValue, setEditCommValue] = useState("");
  const [editBudgetCap, setEditBudgetCap] = useState("");

  function resetForm() {
    setFormName(""); setFormDesc(""); setFormStartDate(""); setFormEndDate("");
    setFormCommType("percentage"); setFormCommValue("10"); setFormBudgetCap("");
    setFormTargetProduct(""); setFormUtmSource(""); setFormUtmMedium(""); setFormUtmCampaign("");
  }

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentQ) params.set("q", currentQ);
    if (filterStatus) params.set("status", filterStatus);
    if (filterDiviner) params.set("diviner_id", filterDiviner);
    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));
    params.set("sort_by", currentSort);
    params.set("sort_dir", currentDir);
    const res = await fetch(`/api/admin/campaigns?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCampaigns(json.data ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [currentQ, filterStatus, filterDiviner, currentPage, pageSize, currentSort, currentDir]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  useEffect(() => {
    // No longer need to fetch all diviners here
  }, []);

  function handleSort(col: string) {
    if (currentSort === col) {
      pushParams({ sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: col, sortDir: "desc" });
    }
  }

  function handleReset() {
    setFilterStatus("");
    setFilterDiviner("");
    pushParams({ q: "", sortBy: "start_date", sortDir: "desc", page: "1" });
  }

  const hasActiveFilters =
    currentQ !== "" || filterStatus !== "" || filterDiviner !== "" ||
    currentSort !== "start_date" || currentDir !== "desc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleCreate() {
    if (!formName.trim() || !formStartDate) { toast.error("Name and start date are required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName, description: formDesc || undefined, start_date: formStartDate,
        end_date: formEndDate || undefined, commission_type: formCommType,
        commission_value: parseFloat(formCommValue) || 0,
        budget_cap_cents: formBudgetCap ? parseInt(formBudgetCap, 10) * 100 : undefined,
        target_product_type: formTargetProduct || undefined,
        utm_source: formUtmSource || undefined, utm_medium: formUtmMedium || undefined,
        utm_campaign: formUtmCampaign || undefined,
      }),
    });
    if (res.ok) {
      toast.success("Campaign created");
      setDialogOpen(false);
      resetForm();
      await loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to create campaign");
    }
    setSaving(false);
  }

  function openEdit(campaign: Campaign) {
    setEditCampaign(campaign);
    setEditName(campaign.name);
    setEditDesc(campaign.description || "");
    setEditStatus(campaign.status);
    setEditStartDate(campaign.start_date);
    setEditEndDate(campaign.end_date || "");
    setEditCommType(campaign.commission_type);
    setEditCommValue(String(campaign.commission_value));
    setEditBudgetCap(campaign.budget_cap_cents ? String(campaign.budget_cap_cents / 100) : "");
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editCampaign) return;
    setEditSaving(true);
    const res = await fetch(`/api/admin/campaigns/${editCampaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName, description: editDesc, status: editStatus,
        start_date: editStartDate, end_date: editEndDate || undefined,
        commission_type: editCommType, commission_value: parseFloat(editCommValue) || 0,
        budget_cap_cents: editBudgetCap ? parseInt(editBudgetCap, 10) * 100 : null,
      }),
    });
    if (res.ok) {
      toast.success("Campaign updated");
      setEditOpen(false);
      setEditCampaign(null);
      await loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to update");
    }
    setEditSaving(false);
  }

  async function handleDelete(campaignId: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/campaigns/${campaignId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campaign deleted");
      await loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to delete");
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} result{total !== 1 ? "s" : ""} · page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/campaigns/analytics">
              <BarChart3 className="mr-2 size-4" />
              Analytics
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="mr-2 size-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Platform-Wide Campaign</DialogTitle>
                <DialogDescription>Create a campaign visible to all diviners and their affiliates.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Summer Promo 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Commission Type</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formCommType} onChange={(e) => setFormCommType(e.target.value)}>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{formCommType === "percentage" ? "Commission %" : "Fixed ($)"}</Label>
                    <Input type="number" min="0" value={formCommValue} onChange={(e) => setFormCommValue(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Budget Cap ($, optional)</Label>
                  <Input type="number" min="0" value={formBudgetCap} onChange={(e) => setFormBudgetCap(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UTM Parameters</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="utm_source" value={formUtmSource} onChange={(e) => setFormUtmSource(e.target.value)} />
                    <Input placeholder="utm_medium" value={formUtmMedium} onChange={(e) => setFormUtmMedium(e.target.value)} />
                    <Input placeholder="utm_campaign" value={formUtmCampaign} onChange={(e) => setFormUtmCampaign(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating...</> : "Create Campaign"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">{campaigns.filter((c) => c.status === "active").length} active on this page</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaigns.reduce((s, c) => s + c.affiliates_count, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaigns.reduce((s, c) => s + c.conversions_count, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-full sm:w-auto flex-1 min-w-[220px] max-w-sm">
          <AdminTableSearch
            defaultValue={currentQ}
            onSearch={(val) => pushParams({ q: val })}
            placeholder="Search by name..."
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); pushParams({ page: "1" }); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <AdminDivinerAutocomplete
          defaultValue={filterDiviner}
          onSelect={(id) => {
            setFilterDiviner(id);
            pushParams({ diviner_id: id, page: "1" });
          }}
          placeholder="All diviners"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadCampaigns()}
          disabled={loading}
          className="gap-1.5 h-9"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Reload
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 h-9"
        >
          <FilterX className="size-3.5" />
          Reset
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader label="Name" column="name" currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
              </TableHead>
              <TableHead>Diviner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>
                <SortHeader label="Start Date" column="start_date" currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="End Date" column="end_date" currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Commission" column="commission_value" currentSort={currentSort} currentDir={currentDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-center">Affiliates</TableHead>
              <TableHead className="text-center">Conversions</TableHead>
              <TableHead className="text-right">Spent / Budget</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 12 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                  No campaigns found.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.name}
                    {c.auto_paused_at && (
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-amber-600">
                        <AlertTriangle className="size-3" /> Auto-paused
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.diviner_name}</TableCell>
                  <TableCell>
                    {c.auto_paused_at ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-2.5" />Auto-Paused
                      </Badge>
                    ) : (
                      <Badge variant={STATUS_BADGE[c.status] ?? "outline"}>{c.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <CampaignDestinationBadge destinationType={c.destination_type} />
                  </TableCell>
                  <TableCell>
                    {c.campaign_code ? (
                      <code className="font-mono text-[11px] text-muted-foreground">{c.campaign_code}</code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(c.start_date)}</TableCell>
                  <TableCell className="text-sm">{c.end_date ? fmtDate(c.end_date) : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {c.commission_type === "percentage"
                      ? `${c.commission_value}%`
                      : `$${Number(c.commission_value).toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-center">{c.affiliates_count}</TableCell>
                  <TableCell className="text-center">{c.conversions_count}</TableCell>
                  <TableCell className="text-right text-sm">
                    {fmtCents(c.spent_cents || 0)}
                    {c.budget_cap_cents ? <span className="text-xs text-muted-foreground"> / {fmtCents(c.budget_cap_cents)}</span> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={(p) => pushParams({ page: String(p) })}
          onPageSizeChange={(s) => {
            setPageSize(parseInt(s, 10));
            pushParams({ page: "1" });
          }}
          isPending={isPending}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update campaign details.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission Type</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editCommType} onChange={(e) => setEditCommType(e.target.value)}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{editCommType === "percentage" ? "Commission %" : "Fixed ($)"}</Label>
                <Input type="number" min="0" value={editCommValue} onChange={(e) => setEditCommValue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget Cap ($)</Label>
              <Input type="number" min="0" value={editBudgetCap} onChange={(e) => setEditBudgetCap(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
