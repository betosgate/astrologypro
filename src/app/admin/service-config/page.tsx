"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  diviner_id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  overage_rate: number;
  pricing_item_key: string | null;
  platform_fee_percent: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

interface Diviner {
  id: string;
  display_name: string;
}

interface PricingPlan {
  id: string;
  display_name: string;
  amount: number;
  onetime_amount: number | null;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

interface PricingItem {
  id: string;
  item_key: string;
  item_name: string;
  pricing_plans?: PricingPlan[];
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ServiceConfigPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [diviners, setDiviners] = useState<Diviner[]>([]);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [search, setSearch] = useState("");

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/services?${params}`);
      if (res.ok) {
        const json = await res.json();
        setServices(json.services ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadDiviners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services/diviners");
      if (res.ok) {
        const json = await res.json();
        setDiviners(json.diviners ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        const json = await res.json();
        setPricingItems(json.items ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadServices(), loadDiviners(), loadPricing()]);
  }, [loadServices, loadDiviners, loadPricing]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/services/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success("Service deleted.");
      setDeleteTarget(null);
      loadServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const divinerMap: Record<string, string> = {};
  for (const d of diviners) divinerMap[d.id] = d.display_name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="size-6 text-primary" />
          Service Config
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage booking services, assign them to diviners, and connect
          pricing.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Booking Services</CardTitle>
            <CardDescription>
              {total} service{total === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-[200px] h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={loadServices}
              disabled={loading}
            >
              <RefreshCw
                className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingService(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : "No services yet. Click Add Service to create one."}
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Diviner
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Duration
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Overage</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => (
                    <tr
                      key={svc.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-2 font-medium">{svc.name}</td>
                      <td className="px-3 py-2 text-xs capitalize">
                        {svc.category}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {divinerMap[svc.diviner_id] ?? "Unknown"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {svc.duration_minutes} min
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums">
                        {Number(svc.base_price) > 0
                          ? `$${Number(svc.base_price).toFixed(2)}`
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums">
                        ${Number(svc.overage_rate ?? 0.50).toFixed(2)}/min
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={
                            svc.is_active
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }
                        >
                          {svc.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => {
                              setEditingService(svc);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(svc)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingService={editingService}
        diviners={diviners}
        pricingItems={pricingItems}
        onSaved={() => {
          setDialogOpen(false);
          setEditingService(null);
          loadServices();
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete service &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the service. Existing bookings linked
              to it will lose their service reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Create/Edit Dialog ────────────────────────────────────────────────────

function ServiceDialog({
  open,
  onOpenChange,
  editingService,
  diviners,
  pricingItems,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingService: Service | null;
  diviners: Diviner[];
  pricingItems: PricingItem[];
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("astrology");
  const [divinerId, setDivinerId] = useState("");
  const [duration, setDuration] = useState("60");
  const [pricingItemKey, setPricingItemKey] = useState("");
  const [overageRate, setOverageRate] = useState("0.50");
  const [platformFeePercent, setPlatformFeePercent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  /** Derive base_price from the selected pricing item's first active plan. */
  function getPriceFromPricingItem(key: string): number {
    const item = pricingItems.find((p) => p.item_key === key);
    if (!item?.pricing_plans?.length) return 0;
    const activePlans = item.pricing_plans
      .filter((p) => p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    const plan = activePlans[0] ?? item.pricing_plans[0];
    return Number(plan.onetime_amount ?? plan.amount) || 0;
  }

  useEffect(() => {
    if (!open) return;
    if (editingService) {
      setName(editingService.name);
      setDescription(editingService.description ?? "");
      setCategory(editingService.category);
      setDivinerId(editingService.diviner_id);
      setDuration(String(editingService.duration_minutes));
      setPricingItemKey(editingService.pricing_item_key ?? "");
      setOverageRate(String(editingService.overage_rate ?? 0.50));
      setPlatformFeePercent(editingService.platform_fee_percent != null ? String(editingService.platform_fee_percent) : "");
      setIsActive(editingService.is_active);
    } else {
      setName("");
      setDescription("");
      setCategory("astrology");
      setDivinerId(diviners[0]?.id ?? "");
      setDuration("60");
      setPricingItemKey("");
      setOverageRate("0.50");
      setPlatformFeePercent("");
      setIsActive(true);
    }
  }, [open, editingService, diviners]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!divinerId) {
      toast.error("Diviner is required.");
      return;
    }

    setSaving(true);
    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : "/api/admin/services";
      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          diviner_id: divinerId,
          duration_minutes: parseInt(duration, 10) || 60,
          base_price: pricingItemKey ? getPriceFromPricingItem(pricingItemKey) : 0,
          overage_rate: parseFloat(overageRate) || 0.50,
          pricing_item_key: pricingItemKey || null,
          platform_fee_percent: platformFeePercent !== "" ? parseFloat(platformFeePercent) : null,
          is_active: isActive,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast.success(
        editingService ? "Service updated." : "Service created.",
      );
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Edit Service" : "Create Service"}
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? "Update the service details."
              : "Add a new booking service."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Natal Chart Reading"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="astrology">Astrology</SelectItem>
                  <SelectItem value="tarot">Tarot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Diviner *</Label>
              <Select value={divinerId} onValueChange={setDivinerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select diviner" />
                </SelectTrigger>
                <SelectContent>
                  {diviners.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pricing Item</Label>
              <Select
                value={pricingItemKey}
                onValueChange={setPricingItemKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to admin price (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {pricingItems.map((p) => {
                    const plans = p.pricing_plans?.filter((pl) => pl.is_active) ?? [];
                    const price = plans.length
                      ? Number(plans[0].onetime_amount ?? plans[0].amount)
                      : null;
                    return (
                      <SelectItem key={p.id} value={p.item_key}>
                        {p.item_name}
                        {price != null && price > 0 ? ` — $${price.toFixed(2)}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Optional — links this service to an admin-managed price.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Overage Rate ($/min)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={overageRate}
              onChange={(e) => setOverageRate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Per-minute rate charged for time beyond the scheduled duration.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Platform Fee % <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="Leave blank to use global default (20%)"
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              % of booking price kept by the platform. Leave blank to use the global 20% default.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="svc-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="svc-active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            )}
            {editingService ? "Save Changes" : "Create Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
