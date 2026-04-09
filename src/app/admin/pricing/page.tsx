"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Loader2,
  Save,
  AlertCircle,
  RefreshCcw,
  Plus,
  Trash2,
  Settings2,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PricingItem {
  id: string;
  item_key: string;
  item_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomField {
  label: string;
  value: string;
  slug: string;
}

interface PricingPlan {
  id: string;
  plan_id: string;
  item_id: string;
  display_name: string;
  amount: number;
  mrp: number | null;
  stripe_price_id: string | null;
  currency: "USD" | "INR";
  description: string | null;
  is_active: boolean;
  sort_order: number;
  custom_fields: CustomField[];
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminPricingPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [formItemKey, setFormItemKey] = useState<string>("");
  const [formItemName, setFormItemName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Plans state
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planSavingId, setPlanSavingId] = useState<string | null>(null);
  const [planTogglingId, setPlanTogglingId] = useState<string | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    display_name: "",
    amount: "",
    mrp: "",
    stripe_price_id: "",
    currency: "INR" as "USD" | "INR",
    description: "",
    custom_fields: [] as CustomField[],
  });
  const [addingPlan, setAddingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editCustomFields, setEditCustomFields] = useState<CustomField[]>([]);
  const [savingCustomFields, setSavingCustomFields] = useState(false);

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ item_key: "", item_name: "", description: "" });
  const [addingItem, setAddingItem] = useState(false);

  // Edit plan state
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({
    display_name: "",
    amount: "",
    mrp: "",
    stripe_price_id: "",
    currency: "INR" as "USD" | "INR",
    description: "",
  });
  const [savingPlanEdit, setSavingPlanEdit] = useState(false);

  // Search, sort, pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<"item_key" | "item_name" | "status">("item_key");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Bottom table: expanded items to show their plans
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [itemPlansCache, setItemPlansCache] = useState<Record<string, PricingPlan[]>>({});
  const [itemPlansLoading, setItemPlansLoading] = useState<string | null>(null);

  /* ---- Load items ---- */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/pricing");
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      const loadedItems = body.items as PricingItem[];
      setItems(loadedItems);
      // Auto-expand the first item
      if (loadedItems.length > 0 && expandedItems.size === 0) {
        const firstId = loadedItems[0].id;
        setExpandedItems(new Set([firstId]));
        // Load its plans
        try {
          const pr = await fetch(`/api/admin/pricing/${firstId}/plans`);
          const pb = await pr.json();
          if (pr.ok) setItemPlansCache((prev) => ({ ...prev, [firstId]: pb.plans as PricingPlan[] }));
        } catch { /* ignore */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = items.find((i) => i.item_key === selectedKey) ?? null;

  // Derived: filtered + sorted + paginated items
  const filteredItems = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = items;
    if (statusFilter !== "all") {
      result = result.filter((i) => statusFilter === "active" ? i.is_active : !i.is_active);
    }
    if (q) {
      result = result.filter(
        (i) =>
          i.item_key.toLowerCase().includes(q) ||
          i.item_name.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      let av: string, bv: string;
      if (sortField === "status") {
        av = a.is_active ? "active" : "inactive";
        bv = b.is_active ? "active" : "inactive";
      } else {
        av = a[sortField];
        bv = b[sortField];
      }
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [items, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = filteredItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function handleSort(field: "item_key" | "item_name" | "status") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  }

  function sortIcon(field: string) {
    if (sortField !== field) return " \u2195";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  /* ---- Load plans when selection changes ---- */
  const loadPlans = useCallback(async (itemId: string) => {
    setPlansLoading(true);
    try {
      const r = await fetch(`/api/admin/pricing/${itemId}/plans`);
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setPlans(body.plans as PricingPlan[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Sync form state when selection changes
  useEffect(() => {
    if (selected) {
      setFormItemKey(selected.item_key);
      setFormItemName(selected.item_name);
      setFormDescription(selected.description ?? "");
      void loadPlans(selected.id);
      setShowAddPlan(false);
    } else {
      setPlans([]);
    }
  }, [selected, loadPlans]);

  /* ---- Save item ---- */
  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/pricing/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: formItemName.trim(),
          description: formDescription.trim() || null,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setItems((prev) =>
        prev.map((i) => (i.id === selected.id ? (body.item as PricingItem) : i)),
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  /* ---- Toggle item active ---- */
  async function handleToggleActive(item: PricingItem) {
    setTogglingId(item.id);
    setError(null);
    try {
      const r = await fetch(`/api/admin/pricing/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? (body.item as PricingItem) : i)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTogglingId(null);
    }
  }

  /* ---- Toggle plan active ---- */
  async function handleTogglePlan(plan: PricingPlan) {
    setPlanTogglingId(plan.id);
    setError(null);
    try {
      const r = await fetch(`/api/admin/pricing/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      const updatedPlan = body.plan as PricingPlan;
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? updatedPlan : p)),
      );
      // Also update cache for bottom table
      setItemPlansCache((prev) => {
        const cached = prev[plan.item_id];
        if (!cached) return prev;
        return { ...prev, [plan.item_id]: cached.map((p) => (p.id === plan.id ? updatedPlan : p)) };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlanTogglingId(null);
    }
  }

  /* ---- Add plan ---- */
  async function handleAddPlan() {
    if (!selected) return;
    setAddingPlan(true);
    setError(null);
    try {
      const amount = Number(newPlan.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        setError("Plan amount must be a non-negative number");
        return;
      }
      const mrp = newPlan.mrp ? Number(newPlan.mrp) : null;
      if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
        setError("MRP must be a non-negative number");
        return;
      }
      const r = await fetch(`/api/admin/pricing/${selected.id}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: newPlan.display_name.trim(),
          amount,
          mrp,
          stripe_price_id: newPlan.stripe_price_id.trim() || null,
          currency: newPlan.currency,
          description: newPlan.description.trim() || null,
          custom_fields: newPlan.custom_fields.map((f) => ({
            label: f.label.trim(),
            value: f.value.trim(),
            slug: f.slug.trim().toLowerCase().replace(/\s+/g, "_"),
          })),
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setPlans((prev) => [...prev, body.plan as PricingPlan]);
      setNewPlan({ display_name: "", amount: "", mrp: "", stripe_price_id: "", currency: "INR", description: "", custom_fields: [] });
      setShowAddPlan(false);
      // Invalidate cache
      setItemPlansCache((prev) => { const n = { ...prev }; delete n[selected.id]; return n; });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingPlan(false);
    }
  }

  /* ---- Open custom fields editor ---- */
  function handleEditCustomFields(plan: PricingPlan) {
    if (editingPlanId === plan.id) {
      setEditingPlanId(null);
      return;
    }
    setEditingPlanId(plan.id);
    setEditCustomFields(plan.custom_fields?.length ? [...plan.custom_fields] : []);
  }

  function handleAddCustomField() {
    setEditCustomFields((prev) => [...prev, { label: "", value: "", slug: "" }]);
  }

  function handleRemoveCustomField(idx: number) {
    setEditCustomFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleCustomFieldChange(idx: number, field: keyof CustomField, val: string) {
    setEditCustomFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)),
    );
  }

  async function handleSaveCustomFields(plan: PricingPlan) {
    const valid = editCustomFields.every((f) => f.label.trim() && f.value.trim() && f.slug.trim());
    if (!valid) {
      setError("Each custom field must have label, value, and slug filled in");
      return;
    }
    setSavingCustomFields(true);
    setError(null);
    try {
      const cleaned = editCustomFields.map((f) => ({
        label: f.label.trim(),
        value: f.value.trim(),
        slug: f.slug.trim().toLowerCase().replace(/\s+/g, "_"),
      }));
      const r = await fetch(`/api/admin/pricing/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_fields: cleaned }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? (body.plan as PricingPlan) : p)),
      );
      setEditingPlanId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingCustomFields(false);
    }
  }

  /* ---- Delete plan ---- */
  async function handleDeletePlan(plan: PricingPlan) {
    if (!confirm(`Delete plan "${plan.display_name}"? This cannot be undone.`)) return;
    setPlanSavingId(plan.id);
    setError(null);
    try {
      const r = await fetch(`/api/admin/pricing/plans/${plan.id}`, { method: "DELETE" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      // Invalidate cache
      if (selected) {
        setItemPlansCache((prev) => { const n = { ...prev }; delete n[selected.id]; return n; });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlanSavingId(null);
    }
  }

  /* ---- Delete item ---- */
  async function handleDeleteItem(item: PricingItem) {
    if (!confirm(`Delete item "${item.item_name}" and ALL its plans? This cannot be undone.`)) return;
    setError(null);
    try {
      const r = await fetch(`/api/admin/pricing/${item.id}`, { method: "DELETE" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selected?.id === item.id) {
        setSelectedKey("");
        setPlans([]);
      }
      // Clean up cache
      setItemPlansCache((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      setExpandedItems((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  /* ---- Add item ---- */
  async function handleAddItem() {
    setAddingItem(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_key: newItem.item_key.trim().toLowerCase().replace(/\s+/g, "_"),
          item_name: newItem.item_name.trim(),
          description: newItem.description.trim() || null,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setItems((prev) => [...prev, body.item as PricingItem]);
      setNewItem({ item_key: "", item_name: "", description: "" });
      setShowAddItem(false);
      // Auto-select the new item
      setSelectedKey((body.item as PricingItem).item_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingItem(false);
    }
  }

  /* ---- Edit plan ---- */
  function handleStartEditPlan(plan: PricingPlan) {
    if (editPlanId === plan.id) {
      setEditPlanId(null);
      return;
    }
    setEditPlanId(plan.id);
    setEditPlanForm({
      display_name: plan.display_name,
      amount: String(plan.amount),
      mrp: plan.mrp !== null ? String(plan.mrp) : "",
      stripe_price_id: plan.stripe_price_id ?? "",
      currency: plan.currency,
      description: plan.description ?? "",
    });
    // Also load custom fields into the editor
    setEditingPlanId(plan.id);
    setEditCustomFields(plan.custom_fields?.length ? [...plan.custom_fields] : []);
  }

  async function handleSavePlanEdit(plan: PricingPlan) {
    setSavingPlanEdit(true);
    setError(null);
    try {
      const amount = Number(editPlanForm.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        setError("Amount must be a non-negative number");
        return;
      }
      const mrp = editPlanForm.mrp ? Number(editPlanForm.mrp) : null;
      if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
        setError("MRP must be a non-negative number");
        return;
      }
      const r = await fetch(`/api/admin/pricing/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: editPlanForm.display_name.trim(),
          amount,
          mrp,
          stripe_price_id: editPlanForm.stripe_price_id.trim() || null,
          currency: editPlanForm.currency,
          description: editPlanForm.description.trim() || null,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      const updatedPlan = body.plan as PricingPlan;
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updatedPlan : p)));
      setItemPlansCache((prev) => {
        const cached = prev[plan.item_id];
        if (!cached) return prev;
        return { ...prev, [plan.item_id]: cached.map((p) => (p.id === plan.id ? updatedPlan : p)) };
      });
      setEditPlanId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPlanEdit(false);
    }
  }

  /* ---- Edit item inline ---- */
  function handleEditItem(item: PricingItem) {
    if (selectedKey === item.item_key) {
      // Collapse
      setSelectedKey("");
      return;
    }
    setSelectedKey(item.item_key);
    // useEffect will sync form + load plans
  }

  /* ---- Expand item to show plans (chevron) ---- */
  async function handleToggleExpand(item: PricingItem) {
    const next = new Set(expandedItems);
    if (next.has(item.id)) {
      next.delete(item.id);
      setExpandedItems(next);
      return;
    }
    next.add(item.id);
    setExpandedItems(next);
    if (!itemPlansCache[item.id]) {
      setItemPlansLoading(item.id);
      try {
        const r = await fetch(`/api/admin/pricing/${item.id}/plans`);
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
        setItemPlansCache((prev) => ({ ...prev, [item.id]: body.plans as PricingPlan[] }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setItemPlansLoading(null);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  /* Helper: render the plans table for an item (used in edit section) */
  function renderPlansSection() {
    if (!selected) return null;
    return (
      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Plans</h3>
            <p className="text-xs text-muted-foreground">
              Each item can have multiple purchasable plans with different pricing.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddPlan(!showAddPlan)}>
            <Plus className="mr-2 size-4" />
            Add Plan
          </Button>
        </div>

        {/* Add plan form */}
        {showAddPlan && renderAddPlanForm()}

        {/* Plans table */}
        {plansLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="size-4 animate-spin" /> Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-2">
            No plans yet. Click &ldquo;Add Plan&rdquo; to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">plan_id</th>
                  <th className="py-2">name</th>
                  <th className="py-2 text-right">amount</th>
                  <th className="py-2 text-right">mrp</th>
                  <th className="py-2">stripe price</th>
                  <th className="py-2">status</th>
                  <th className="py-2 text-center">fields</th>
                  <th className="py-2 text-center">toggle</th>
                  <th className="py-2 text-center">actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <React.Fragment key={plan.id}>
                  <tr className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs max-w-[140px] truncate" title={plan.plan_id}>{plan.plan_id}</td>
                    <td className="py-2">
                      <div>{plan.display_name}</div>
                      {plan.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={plan.description}>{plan.description}</div>}
                    </td>
                    <td className="py-2 text-right tabular-nums">{plan.currency} {plan.amount.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{plan.mrp !== null ? `${plan.currency} ${plan.mrp.toLocaleString()}` : "\u2014"}</td>
                    <td className="py-2 font-mono text-xs max-w-[120px] truncate" title={plan.stripe_price_id ?? ""}>{plan.stripe_price_id ?? "\u2014"}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={plan.is_active ? "border-emerald-500/40 text-emerald-700" : "border-red-500/40 text-red-600"}>
                        {plan.is_active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="py-2 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCustomFields(plan)} title="Edit custom fields">
                        <Settings2 className="size-4" />
                        {plan.custom_fields?.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{plan.custom_fields.length}</Badge>}
                      </Button>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch checked={plan.is_active} disabled={planTogglingId === plan.id} onCheckedChange={() => handleTogglePlan(plan)} aria-label={`Toggle ${plan.display_name}`} />
                        {planTogglingId === plan.id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleStartEditPlan(plan)} title="Edit plan"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={planSavingId === plan.id} onClick={() => handleDeletePlan(plan)}>
                          {planSavingId === plan.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Edit plan row */}
                  {editPlanId === plan.id && (
                    <tr><td colSpan={9} className="py-3 px-2">
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Edit Plan &ldquo;{plan.display_name}&rdquo;</p>
                          <Button variant="ghost" size="sm" onClick={() => setEditPlanId(null)}><X className="size-4" /></Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5"><Label className="text-xs">Display Name *</Label><Input value={editPlanForm.display_name} onChange={(e) => setEditPlanForm({ ...editPlanForm, display_name: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Stripe Price ID</Label><Input placeholder="price_..." value={editPlanForm.stripe_price_id} onChange={(e) => setEditPlanForm({ ...editPlanForm, stripe_price_id: e.target.value })} /></div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5"><Label className="text-xs">Amount *</Label><Input type="number" min="0" step="0.01" value={editPlanForm.amount} onChange={(e) => setEditPlanForm({ ...editPlanForm, amount: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">MRP</Label><Input type="number" min="0" step="0.01" placeholder="Original price" value={editPlanForm.mrp} onChange={(e) => setEditPlanForm({ ...editPlanForm, mrp: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Currency</Label>
                            <Select value={editPlanForm.currency} onValueChange={(v) => setEditPlanForm({ ...editPlanForm, currency: v as "USD" | "INR" })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input placeholder="Optional" value={editPlanForm.description} onChange={(e) => setEditPlanForm({ ...editPlanForm, description: e.target.value })} /></div>
                        {/* Custom fields inline */}
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Custom Fields</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField}><Plus className="mr-1 size-3" />Add Field</Button>
                          </div>
                          {editCustomFields.length === 0 && <p className="text-xs text-muted-foreground italic">No custom fields.</p>}
                          {editCustomFields.map((cf, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                              <div className="space-y-1">{idx === 0 && <Label className="text-xs">Label</Label>}<Input placeholder="e.g. Duration" value={cf.label} onChange={(e) => handleCustomFieldChange(idx, "label", e.target.value)} /></div>
                              <div className="space-y-1">{idx === 0 && <Label className="text-xs">Value</Label>}<Input placeholder="e.g. 3 Months" value={cf.value} onChange={(e) => handleCustomFieldChange(idx, "value", e.target.value)} /></div>
                              <div className="space-y-1">{idx === 0 && <Label className="text-xs">Slug</Label>}<Input placeholder="e.g. duration" value={cf.slug} onChange={(e) => handleCustomFieldChange(idx, "slug", e.target.value)} /></div>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveCustomField(idx)}><Trash2 className="size-4" /></Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" onClick={() => handleSavePlanEdit(plan)} disabled={savingPlanEdit || !editPlanForm.display_name.trim()}>
                            {savingPlanEdit && <Loader2 className="mr-2 size-4 animate-spin" />}<Save className="mr-1 size-4" />Save Plan
                          </Button>
                          {editCustomFields.length > 0 && (
                            <Button size="sm" variant="outline" onClick={() => handleSaveCustomFields(plan)} disabled={savingCustomFields}>
                              {savingCustomFields && <Loader2 className="mr-2 size-4 animate-spin" />}<Save className="mr-1 size-4" />Save Fields
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setEditPlanId(null); setEditingPlanId(null); }}>Cancel</Button>
                        </div>
                      </div>
                    </td></tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* Helper: render the add plan form */
  function renderAddPlanForm() {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <p className="text-sm font-medium">New Plan</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Display Name *</Label><Input placeholder="e.g. Monthly Plan" value={newPlan.display_name} onChange={(e) => setNewPlan({ ...newPlan, display_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Stripe Price ID</Label><Input placeholder="price_..." value={newPlan.stripe_price_id} onChange={(e) => setNewPlan({ ...newPlan, stripe_price_id: e.target.value })} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label>Amount *</Label><Input type="number" min="0" step="0.01" value={newPlan.amount} onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>MRP</Label><Input type="number" min="0" step="0.01" placeholder="Original price" value={newPlan.mrp} onChange={(e) => setNewPlan({ ...newPlan, mrp: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={newPlan.currency} onValueChange={(v) => setNewPlan({ ...newPlan, currency: v as "USD" | "INR" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Description</Label><Input placeholder="Optional plan description" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} /></div>
        {/* Custom fields */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Custom Fields</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setNewPlan({ ...newPlan, custom_fields: [...newPlan.custom_fields, { label: "", value: "", slug: "" }] })}>
              <Plus className="mr-1 size-3" />Add Field
            </Button>
          </div>
          {newPlan.custom_fields.length === 0 && <p className="text-xs text-muted-foreground italic">No custom fields added.</p>}
          {newPlan.custom_fields.map((cf, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div className="space-y-1">{idx === 0 && <Label className="text-xs">Label</Label>}<Input placeholder="e.g. Duration" value={cf.label} onChange={(e) => { const u = [...newPlan.custom_fields]; u[idx] = { ...u[idx], label: e.target.value }; setNewPlan({ ...newPlan, custom_fields: u }); }} /></div>
              <div className="space-y-1">{idx === 0 && <Label className="text-xs">Value</Label>}<Input placeholder="e.g. 3 Months" value={cf.value} onChange={(e) => { const u = [...newPlan.custom_fields]; u[idx] = { ...u[idx], value: e.target.value }; setNewPlan({ ...newPlan, custom_fields: u }); }} /></div>
              <div className="space-y-1">{idx === 0 && <Label className="text-xs">Slug</Label>}<Input placeholder="e.g. duration" value={cf.slug} onChange={(e) => { const u = [...newPlan.custom_fields]; u[idx] = { ...u[idx], slug: e.target.value }; setNewPlan({ ...newPlan, custom_fields: u }); }} /></div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setNewPlan({ ...newPlan, custom_fields: newPlan.custom_fields.filter((_, i) => i !== idx) })}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleAddPlan} disabled={addingPlan || !newPlan.display_name.trim()}>
            {addingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}Create Plan
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAddPlan(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <DollarSign className="size-7 text-primary mt-1" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pricing Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage pricing items and their plans. Signup pages read these via{" "}
              <code className="text-xs">/api/pricing/[itemKey]</code>.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddItem(!showAddItem)}>
            <Plus className="mr-2 size-4" />
            Add Item
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Add item form */}
      {showAddItem && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-medium">New Item</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-item-key">Item Key *</Label>
                <Input id="new-item-key" placeholder="e.g. mystery_school" className="font-mono text-sm" value={newItem.item_key} onChange={(e) => setNewItem({ ...newItem, item_key: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-item-name">Display Name *</Label>
                <Input id="new-item-name" placeholder="e.g. Mystery School" value={newItem.item_name} onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-item-desc">Description</Label>
              <Input id="new-item-desc" placeholder="Optional description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleAddItem} disabled={addingItem || !newItem.item_key.trim() || !newItem.item_name.trim()}>
                {addingItem && <Loader2 className="mr-2 size-4 animate-spin" />}Create Item
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddItem(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* ============================================================ */}
      {/* All Items & Plans — single list with inline edit               */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All Items &amp; Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + Status filter */}
          <div className="flex gap-3 items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by key or name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "all" | "active" | "inactive"); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {items.length === 0 ? "No pricing items yet." : "No items match your search."}
            </p>
          ) : (
            <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 w-8"></th>
                  <th className="py-2 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("item_key")}>
                    item_key{sortIcon("item_key")}
                  </th>
                  <th className="py-2 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("item_name")}>
                    name{sortIcon("item_name")}
                  </th>
                  <th className="py-2 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("status")}>
                    status{sortIcon("status")}
                  </th>
                  <th className="py-2 text-center">toggle</th>
                  <th className="py-2 text-center">actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <React.Fragment key={item.id}>
                    {/* Item row */}
                    <tr className="border-b cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleToggleExpand(item)}>
                      <td className="py-2 text-center">
                        {expandedItems.has(item.id) ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                      </td>
                      <td className="py-2 font-mono text-xs">{item.item_key}</td>
                      <td className="py-2 font-medium">{item.item_name}</td>
                      <td className="py-2">
                        <Badge variant="outline" className={item.is_active ? "border-emerald-500/40 text-emerald-700" : "border-red-500/40 text-red-600"}>
                          {item.is_active ? "active" : "inactive"}
                        </Badge>
                      </td>
                      <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <Switch checked={item.is_active} disabled={togglingId === item.id} onCheckedChange={() => handleToggleActive(item)} aria-label={`Toggle ${item.item_name}`} />
                          {togglingId === item.id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                        </div>
                      </td>
                      <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)} title="Edit item"><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteItem(item)}><Trash2 className="size-4" /></Button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit form */}
                    {selectedKey === item.item_key && selected && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-muted/20 border-b">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Edit Item</h3>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedKey("")}><X className="size-4" /></Button>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5"><Label>Item Key</Label><Input value={formItemKey} onChange={(e) => setFormItemKey(e.target.value)} className="font-mono text-sm" /></div>
                                <div className="space-y-1.5"><Label>Display Name</Label><Input value={formItemName} onChange={(e) => setFormItemName(e.target.value)} /></div>
                              </div>
                              <div className="space-y-1.5"><Label>Description (optional)</Label><Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} /></div>
                              <div className="flex items-center gap-3">
                                <Button onClick={handleSave} disabled={saving} size="sm">
                                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}<Save className="mr-2 size-4" />Save Item
                                </Button>
                                {savedFlash && <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">Saved</Badge>}
                              </div>
                            </div>
                            {renderPlansSection()}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Nested plans preview (chevron expand, only when NOT editing) */}
                    {expandedItems.has(item.id) && selectedKey !== item.item_key && (
                      <>
                        {itemPlansLoading === item.id ? (
                          <tr><td colSpan={6} className="py-3 pl-10"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Loading plans...</div></td></tr>
                        ) : (itemPlansCache[item.id] ?? []).length === 0 ? (
                          <tr><td colSpan={6} className="py-3 pl-10"><p className="text-xs text-muted-foreground italic">No plans for this item.</p></td></tr>
                        ) : (
                          (itemPlansCache[item.id] ?? []).map((plan, idx, arr) => (
                            <tr key={plan.id} className={idx === arr.length - 1 ? "border-b" : ""}>
                              <td className="py-1.5 text-right pr-1 text-muted-foreground text-xs">{idx === arr.length - 1 ? "\u2514" : "\u251C"}</td>
                              <td className="py-1.5 font-mono text-xs text-muted-foreground" title={plan.plan_id}>{plan.plan_id}</td>
                              <td className="py-1.5">
                                <span className="text-xs">{plan.display_name}</span>
                                <span className="ml-2 text-xs tabular-nums font-medium">{plan.currency} {plan.amount.toLocaleString()}</span>
                                {plan.mrp !== null && <span className="ml-1 text-xs tabular-nums text-muted-foreground line-through">{plan.mrp.toLocaleString()}</span>}
                              </td>
                              <td className="py-1.5">
                                <Badge variant="outline" className={`text-[10px] ${plan.is_active ? "border-emerald-500/40 text-emerald-700" : "border-red-500/40 text-red-600"}`}>
                                  {plan.is_active ? "active" : "inactive"}
                                </Badge>
                              </td>
                              <td className="py-1.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Switch checked={plan.is_active} disabled={planTogglingId === plan.id} onCheckedChange={() => handleTogglePlan(plan)} aria-label={`Toggle ${plan.display_name}`} className="scale-75" />
                                  {planTogglingId === plan.id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                                </div>
                              </td>
                              <td></td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredItems.length)} of {filteredItems.length} items
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button key={i} variant={i === safePage ? "default" : "outline"} size="sm" className="min-w-[32px]" onClick={() => setPage(i)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
