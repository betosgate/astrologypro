"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Plus, RefreshCw, CheckCircle2, Clock, Archive } from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceRow {
  template_id: string;
  template_name: string;
  template_slug: string;
  template_category: "astrology" | "tarot";
  base_price: number;
  duration_minutes: number;
  is_primary: boolean;
  diviner_service_id: string | null;
  is_enabled: boolean;
  is_published: boolean;
  publish_status: string;
  price: number;
  notes: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  enabled_by_name: string | null;
  disabled_by_name: string | null;
  has_custom_service: boolean;
  landing_page_url: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  performed_by_role: string;
  performer_name: string;
  reason: string | null;
  created_at: string;
  service_templates: { name: string; slug: string } | null;
}

interface Props {
  divinerId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function PublishBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <Badge className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Published
      </Badge>
    );
  }
  if (status === "draft") {
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
        <Clock className="h-3 w-3 mr-1" /> Draft
      </Badge>
    );
  }
  if (status === "archived") {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        <Archive className="h-3 w-3 mr-1" /> Archived
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Unpublished
    </Badge>
  );
}

function ActionLabel(action: string) {
  const map: Record<string, string> = {
    service_enabled:          "Enabled",
    service_disabled:         "Disabled",
    landing_page_published:   "Published",
    landing_page_unpublished: "Unpublished",
    landing_page_archived:    "Archived",
    override_applied:         "Override applied",
    override_removed:         "Override removed",
    custom_content_updated:   "Content updated",
    link_copied:              "Link copied",
    link_shared:              "Link shared",
    route_changed:            "Route changed",
  };
  return map[action] ?? action;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ServiceAssignment({ divinerId }: Props) {
  const [services, setServices]     = useState<ServiceRow[]>([]);
  const [auditLog, setAuditLog]     = useState<AuditEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "astrology" | "tarot">("all");
  const [statusFilter, setStatusFilter]     = useState<"all" | "enabled" | "disabled">("all");

  // Assign dialog
  const [assignTarget, setAssignTarget] = useState<ServiceRow | null>(null);
  const [assignPrice, setAssignPrice]   = useState("");
  const [assignNotes, setAssignNotes]   = useState("");
  const [assigning, setAssigning]       = useState(false);

  // Disable confirmation
  const [disableTarget, setDisableTarget] = useState<ServiceRow | null>(null);
  const [disableNote, setDisableNote]     = useState("");
  const [disabling, setDisabling]         = useState(false);

  // Clone dialog
  const [showClone, setShowClone]           = useState(false);
  const [sourceDivinerId, setSourceDivinerID] = useState("");
  const [cloning, setCloning]               = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, auditRes] = await Promise.all([
        fetch(`/api/admin/diviners/${divinerId}/services`),
        fetch(`/api/admin/diviners/${divinerId}/services/audit-log?limit=10`),
      ]);
      if (!svcRes.ok) throw new Error("Failed to load services");
      const svcJson = await svcRes.json();
      setServices(svcJson.services ?? []);
      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        setAuditLog(auditJson.entries ?? []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [divinerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle enable ──────────────────────────────────────────────────────────
  async function handleEnableToggle(svc: ServiceRow, enabling: boolean) {
    if (!enabling) {
      // Need confirmation before disabling
      setDisableTarget(svc);
      setDisableNote("");
      return;
    }

    if (!svc.diviner_service_id) {
      // Not yet assigned — open assign dialog
      setAssignTarget(svc);
      setAssignPrice(svc.base_price.toString());
      setAssignNotes("");
      return;
    }

    await patchService(svc.template_id, { is_enabled: true });
  }

  async function confirmDisable() {
    if (!disableTarget) return;
    setDisabling(true);
    try {
      await patchService(disableTarget.template_id, { is_enabled: false, notes: disableNote || null });
      setDisableTarget(null);
    } finally {
      setDisabling(false);
    }
  }

  // ── Toggle publish ─────────────────────────────────────────────────────────
  async function handlePublishToggle(svc: ServiceRow, publishing: boolean) {
    await patchService(svc.template_id, { is_published: publishing });
  }

  // ── Assign service ─────────────────────────────────────────────────────────
  async function handleAssign() {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/diviners/${divinerId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: assignTarget.template_id,
          price: parseFloat(assignPrice) || assignTarget.base_price,
          notes: assignNotes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.info("Service already assigned — enabling it");
          await patchService(assignTarget.template_id, { is_enabled: true });
        } else {
          throw new Error(json.error ?? "Assign failed");
        }
      } else {
        toast.success(`"${assignTarget.template_name}" assigned`);
      }
      setAssignTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setAssigning(false);
    }
  }

  // ── Generic patch ──────────────────────────────────────────────────────────
  async function patchService(templateId: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/diviners/${divinerId}/services/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Update failed");
      return;
    }
    toast.success("Updated");
    fetchData();
  }

  // ── Bulk operations ────────────────────────────────────────────────────────
  async function bulkAction(action: "enable" | "disable" | "publish" | "unpublish") {
    const ids = services.map((s) => s.template_id);
    const res = await fetch(`/api/admin/diviners/${divinerId}/services/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, template_ids: ids }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Bulk action failed"); return; }
    toast.success(`${json.updated} service${json.updated !== 1 ? "s" : ""} ${action}d`);
    fetchData();
  }

  // ── Clone ──────────────────────────────────────────────────────────────────
  async function handleClone() {
    if (!sourceDivinerId.trim()) return;
    setCloning(true);
    try {
      const res = await fetch(`/api/admin/diviners/${divinerId}/services/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_diviner_id: sourceDivinerId.trim(), include_prices: true, include_publish: false }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Clone failed"); return; }
      toast.success(`Cloned ${json.cloned} service${json.cloned !== 1 ? "s" : ""} (${json.skipped} skipped)`);
      setShowClone(false);
      setSourceDivinerID("");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Clone failed");
    } finally {
      setCloning(false);
    }
  }

  // ── Filter & group ─────────────────────────────────────────────────────────
  const filtered = services.filter((s) => {
    if (categoryFilter !== "all" && s.template_category !== categoryFilter) return false;
    if (statusFilter === "enabled" && !s.is_enabled) return false;
    if (statusFilter === "disabled" && s.is_enabled) return false;
    return true;
  });

  const astrology = filtered.filter((s) => s.template_category === "astrology");
  const tarot     = filtered.filter((s) => s.template_category === "tarot");

  const enabledCount = services.filter((s) => s.is_enabled).length;
  const publishedCount = services.filter((s) => s.is_published).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{enabledCount}/{services.length} enabled</span>
          <span>·</span>
          <span>{publishedCount} published</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => bulkAction("enable")}>Enable All</Button>
          <Button variant="outline" size="sm" onClick={() => bulkAction("disable")}>Disable All</Button>
          <Button variant="outline" size="sm" onClick={() => setShowClone(true)}>Clone from Diviner</Button>
          <Button variant="ghost" size="sm" onClick={fetchData} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="astrology">Astrology</SelectItem>
            <SelectItem value="tarot">Tarot</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend: explains the two toggle columns */}
      <div className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-md px-3 py-2 flex flex-wrap gap-x-5 gap-y-1">
        <span><strong className="text-foreground">Left toggle = Active</strong> — whether this diviner can offer this service at all.</span>
        <span><strong className="text-foreground">Right toggle = Published</strong> — whether the landing page is visible to the public.</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Astrology */}
          {astrology.length > 0 && (
            <ServiceGroup label="⭐ Astrology Services" rows={astrology} divinerId={divinerId}
              onEnableToggle={handleEnableToggle} onPublishToggle={handlePublishToggle}
              onAssign={(svc) => { setAssignTarget(svc); setAssignPrice(svc.base_price.toString()); setAssignNotes(""); }}
            />
          )}

          {/* Tarot */}
          {tarot.length > 0 && (
            <ServiceGroup label="🃏 Tarot Services" rows={tarot} divinerId={divinerId}
              onEnableToggle={handleEnableToggle} onPublishToggle={handlePublishToggle}
              onAssign={(svc) => { setAssignTarget(svc); setAssignPrice(svc.base_price.toString()); setAssignNotes(""); }}
            />
          )}

          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">No services match the current filters.</p>
          )}
        </>
      )}

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Recent Changes
          </h3>
          <div className="rounded-lg border divide-y text-xs">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 px-3 py-2">
                <span className="text-muted-foreground min-w-[120px] shrink-0">
                  {fmtDateTime(entry.created_at)}
                </span>
                <span className="font-medium">{ActionLabel(entry.action)}</span>
                {entry.service_templates?.name && (
                  <span className="text-muted-foreground">{entry.service_templates.name}</span>
                )}
                <span className="text-muted-foreground ml-auto shrink-0">by {entry.performer_name}</span>
                {entry.reason && (
                  <span className="text-muted-foreground italic">&ldquo;{entry.reason}&rdquo;</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Assign Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {assignTarget?.template_name}</DialogTitle>
            <DialogDescription>
              Enable this service for this diviner. They will be able to publish it from their dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Price ($)</Label>
              <Input
                type="number"
                value={assignPrice}
                onChange={(e) => setAssignPrice(e.target.value)}
                step="0.01"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Template base price: ${assignTarget?.base_price}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Input
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="e.g. Enabled during onboarding review"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? "Assigning…" : "Assign Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disable Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {disableTarget?.template_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unpublish the landing page and remove the diviner&apos;s access to this service.
              Existing bookings will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-4 pb-2">
            <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
            <Textarea
              value={disableNote}
              onChange={(e) => setDisableNote(e.target.value)}
              rows={2}
              placeholder="e.g. Diviner not certified for this service"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDisable}
              disabled={disabling}
            >
              {disabling ? "Disabling…" : "Disable Service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Clone Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showClone} onOpenChange={setShowClone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Service Setup</DialogTitle>
            <DialogDescription>
              Copy all enabled services from another diviner to this one. Existing assignments will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Source Diviner ID</Label>
            <Input
              value={sourceDivinerId}
              onChange={(e) => setSourceDivinerID(e.target.value)}
              placeholder="UUID of the source diviner"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Prices will be copied. Services will be assigned in draft state (not published).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClone(false)}>Cancel</Button>
            <Button onClick={handleClone} disabled={cloning || !sourceDivinerId.trim()}>
              {cloning ? "Cloning…" : "Clone Services"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── ServiceGroup sub-component ────────────────────────────────────────────────

interface ServiceGroupProps {
  label: string;
  rows: ServiceRow[];
  divinerId: string;
  onEnableToggle: (svc: ServiceRow, enabling: boolean) => void;
  onPublishToggle: (svc: ServiceRow, publishing: boolean) => void;
  onAssign: (svc: ServiceRow) => void;
}

function ServiceGroup({ label, rows, onEnableToggle, onPublishToggle, onAssign }: ServiceGroupProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</h3>
      <div className="rounded-lg border divide-y">
        {rows.map((svc) => (
          <ServiceRow
            key={svc.template_id}
            svc={svc}
            onEnableToggle={onEnableToggle}
            onPublishToggle={onPublishToggle}
            onAssign={onAssign}
          />
        ))}
      </div>
    </div>
  );
}

// ── ServiceRow sub-component ──────────────────────────────────────────────────

interface ServiceRowProps {
  svc: ServiceRow;
  onEnableToggle: (svc: ServiceRow, enabling: boolean) => void;
  onPublishToggle: (svc: ServiceRow, publishing: boolean) => void;
  onAssign: (svc: ServiceRow) => void;
}

function ServiceRow({ svc, onEnableToggle, onPublishToggle, onAssign }: ServiceRowProps) {
  const isAssigned = !!svc.diviner_service_id;

  return (
    <div className={`flex items-start gap-3 px-3 py-3 text-sm ${!svc.is_enabled && isAssigned ? "opacity-50" : ""}`}>
      {/* Enable toggle */}
      <div className="flex flex-col items-center pt-0.5 gap-1 min-w-[64px]">
        {isAssigned ? (
          <>
            <Switch
              checked={svc.is_enabled}
              onCheckedChange={(v) => onEnableToggle(svc, v)}
              aria-label={`${svc.is_enabled ? "Disable" : "Enable"} ${svc.template_name}`}
              title={svc.is_enabled ? "Admin: deactivate this service" : "Admin: activate this service"}
            />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
              {svc.is_enabled ? "Active" : "Inactive"}
            </span>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onAssign(svc)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        )}
      </div>

      {/* Service info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className={`font-medium ${!svc.is_enabled && isAssigned ? "line-through text-muted-foreground" : ""}`}>
            {svc.template_name}
          </span>
          {svc.is_primary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
          {isAssigned && <PublishBadge status={svc.publish_status} />}
        </div>

        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
          <span>{svc.duration_minutes} min</span>
          <span>${svc.price ?? svc.base_price}</span>
          {svc.is_enabled && svc.enabled_at && (
            <span>Enabled {fmtDate(svc.enabled_at)}{svc.enabled_by_name ? ` by ${svc.enabled_by_name}` : ""}</span>
          )}
          {!svc.is_enabled && svc.disabled_at && (
            <span>Disabled {fmtDate(svc.disabled_at)}{svc.disabled_by_name ? ` by ${svc.disabled_by_name}` : ""}</span>
          )}
          {svc.notes && <span className="italic">&ldquo;{svc.notes}&rdquo;</span>}
        </div>

        {svc.landing_page_url && svc.is_published && (
          <div className="mt-1 flex items-center gap-1.5">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[260px]">
              {svc.landing_page_url}
            </code>
            <button
              className="text-muted-foreground hover:text-foreground"
              title="Copy URL"
              onClick={() => {
                navigator.clipboard.writeText(`https://astrologypro.com${svc.landing_page_url}`);
                toast.success("URL copied");
              }}
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Publish toggle */}
      <div className="flex flex-col items-center pt-0.5 gap-1 min-w-[72px]">
        {isAssigned && svc.is_enabled ? (
          <>
            <Switch
              checked={svc.is_published}
              onCheckedChange={(v) => onPublishToggle(svc, v)}
              aria-label={`${svc.is_published ? "Unpublish" : "Publish"} ${svc.template_name}`}
              title={svc.is_published ? "Unpublish this landing page" : "Publish this landing page"}
            />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
              {svc.is_published ? "Published" : "Unpublished"}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>
    </div>
  );
}
