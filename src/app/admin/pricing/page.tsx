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
import { HtmlEditor } from "@/components/ui/html-editor";
import {
  DollarSign,
  Loader2,
  Save,
  AlertCircle,
  RefreshCcw,
  Plus,
  Trash2,
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
  stripe_product_id: string | null;
  stripe_product_name: string | null;
  payment_provider: string | null;
  payment_provider_id: string | null;
  html_description: string | null;
  created_at: string;
  updated_at: string;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
}

interface StripePrice {
  id: string;
  nickname: string | null;
  unit_amount: number | null;
  currency: string;
  type: string;
  recurring: { interval: string; interval_count: number } | null;
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
  currency: "USD" | "INR";
  onetime_amount: number | null;
  onetime_currency: string | null;
  recurring_amount: number | null;
  recurring_currency: string | null;
  recurring_interval: string | null;
  stripe_price_id: string | null;
  stripe_price_name: string | null;
  description: string | null;
  html_description: string | null;
  is_active: boolean;
  sort_order: number;
  custom_fields: CustomField[];
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface StripeAccount {
  id: string;
  business_name: string | null;
  email: string | null;
  country: string | null;
  default_currency: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  livemode: boolean;
  key_prefix: string;
}

export default function AdminPricingPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [formItemKey, setFormItemKey] = useState<string>("");
  const [formItemName, setFormItemName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formHtmlDescription, setFormHtmlDescription] = useState<string>("");
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
    onetime_amount: "",
    onetime_currency: "USD" as "USD" | "INR",
    has_subscription: false,
    stripe_price_id: "",
    stripe_price_name: "",
    recurring_amount: "",
    recurring_currency: "USD" as "USD" | "INR",
    recurring_interval: "month" as "month" | "year",
    description: "",
    html_description: "",
    custom_fields: [] as CustomField[],
  });
  const [addingPlan, setAddingPlan] = useState(false);
  const [editCustomFields, setEditCustomFields] = useState<CustomField[]>([]);
  const [savingCustomFields, setSavingCustomFields] = useState(false);

  // Add item state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ item_key: "", item_name: "", description: "", stripe_product_name: "" });
  const [addingItem, setAddingItem] = useState(false);

  // Stripe product state (for item form)
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);
  const [stripeProductQuery, setStripeProductQuery] = useState("");
  const [stripeProductsLoading, setStripeProductsLoading] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedStripeProduct, setSelectedStripeProduct] = useState<StripeProduct | null>(null);

  // Stripe price state (for plan form)
  const [stripePrices, setStripePrices] = useState<StripePrice[]>([]);
  const [stripePricesLoading, setStripePricesLoading] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  // Edit plan state
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({
    display_name: "",
    mrp: "",
    onetime_amount: "",
    onetime_currency: "USD" as "USD" | "INR",
    has_subscription: false,
    recurring_amount: "",
    recurring_currency: "",
    recurring_interval: "month" as "month" | "year",
    stripe_price_id: "",
    stripe_price_name: "",
    description: "",
    html_description: "",
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
    // Load Stripe account info
    fetch("/api/admin/stripe/account")
      .then((r) => r.json())
      .then((b) => { if (b.account) setStripeAccount(b.account as StripeAccount); })
      .catch(() => { /* ignore */ });
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
      setFormHtmlDescription(selected.html_description ?? "");
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
          html_description: formHtmlDescription || null,
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
      // One-time payment
      let onetimeAmount: number | null = null;
      if (newPlan.onetime_amount) {
        onetimeAmount = Number(newPlan.onetime_amount);
        if (!Number.isFinite(onetimeAmount) || onetimeAmount < 0) {
          setError("One-time amount must be a non-negative number");
          return;
        }
      }
      const mrp = newPlan.mrp ? Number(newPlan.mrp) : null;
      if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
        setError("MRP must be a non-negative number");
        return;
      }

      // Subscription / Stripe price
      let stripePriceId = newPlan.stripe_price_id.trim() || null;
      let stripePriceName = newPlan.stripe_price_name ?? "";
      let recurringAmount: number | null = null;
      let recurringCurrency: string | null = null;

      if (newPlan.has_subscription && !stripePriceId && selected.stripe_product_id && stripePriceName) {
        // Create new Stripe price
        const recurAmt = Number(newPlan.recurring_amount);
        if (!Number.isFinite(recurAmt) || recurAmt <= 0) {
          setError("Recurring amount is required for subscription");
          return;
        }
        const stripePrice = await createStripePrice(
          selected.stripe_product_id,
          stripePriceName.trim(),
          recurAmt,
          newPlan.recurring_currency,
          newPlan.recurring_interval,
        );
        stripePriceId = stripePrice.id;
        recurringAmount = stripePrice.unit_amount ? stripePrice.unit_amount / 100 : recurAmt;
        recurringCurrency = stripePrice.currency.toUpperCase();
      } else if (newPlan.has_subscription && stripePriceId) {
        recurringAmount = newPlan.recurring_amount ? Number(newPlan.recurring_amount) : null;
        recurringCurrency = newPlan.recurring_currency;
      }

      const r = await fetch(`/api/admin/pricing/${selected.id}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: newPlan.display_name.trim(),
          onetime_amount: onetimeAmount,
          onetime_currency: onetimeAmount !== null ? newPlan.onetime_currency : null,
          recurring_amount: recurringAmount,
          recurring_currency: recurringCurrency,
          recurring_interval: newPlan.has_subscription ? newPlan.recurring_interval : null,
          mrp,
          stripe_price_id: stripePriceId,
          stripe_price_name: stripePriceName.trim() || null,
          description: newPlan.description.trim() || null,
          html_description: newPlan.html_description.trim() || null,
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
      setNewPlan({ display_name: "", amount: "", mrp: "", onetime_amount: "", onetime_currency: "USD", has_subscription: false, stripe_price_id: "", stripe_price_name: "", recurring_amount: "", recurring_currency: "USD", recurring_interval: "month", description: "", html_description: "", custom_fields: [] });
      setShowPriceDropdown(false);
      setShowAddPlan(false);
      setItemPlansCache((prev) => { const n = { ...prev }; delete n[selected.id]; return n; });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingPlan(false);
    }
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
      setEditPlanId(null);
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
      // Step 1: Create or reuse Stripe product
      let stripeProductId = selectedStripeProduct?.id ?? null;
      let stripeProductName = newItem.stripe_product_name.trim() || newItem.item_name.trim();

      if (!stripeProductId && stripeProductName) {
        // Create new Stripe product
        const pr = await fetch("/api/admin/stripe/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: stripeProductName }),
        });
        const pb = await pr.json();
        if (!pr.ok) throw new Error(pb.error ?? "Failed to create Stripe product");
        stripeProductId = pb.product.id;
        stripeProductName = pb.product.name;
      }

      // Step 2: Create item in DB
      const r = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_key: newItem.item_key.trim().toLowerCase().replace(/\s+/g, "_"),
          item_name: newItem.item_name.trim(),
          description: newItem.description.trim() || null,
          stripe_product_id: stripeProductId,
          stripe_product_name: stripeProductName,
          payment_provider: "stripe",
          payment_provider_id: stripeAccount?.id ?? null,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setItems((prev) => [...prev, body.item as PricingItem]);
      setNewItem({ item_key: "", item_name: "", description: "", stripe_product_name: "" });
      setSelectedStripeProduct(null);
      setStripeProductQuery("");
      setShowAddItem(false);
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
      mrp: plan.mrp !== null ? String(plan.mrp) : "",
      onetime_amount: plan.onetime_amount !== null ? String(plan.onetime_amount) : "",
      onetime_currency: (plan.onetime_currency ?? "USD") as "USD" | "INR",
      has_subscription: plan.recurring_amount != null || !!plan.stripe_price_id,
      recurring_amount: plan.recurring_amount !== null ? String(plan.recurring_amount) : "",
      recurring_currency: plan.recurring_currency ?? "",
      recurring_interval: (plan.recurring_interval ?? "month") as "month" | "year",
      stripe_price_id: plan.stripe_price_id ?? "",
      stripe_price_name: plan.stripe_price_name ?? "",
      description: plan.description ?? "",
      html_description: plan.html_description ?? "",
    });
    // Also load custom fields into the editor
    setEditPlanId(plan.id);
    setEditCustomFields(plan.custom_fields?.length ? [...plan.custom_fields] : []);
  }

  async function handleSavePlanEdit(plan: PricingPlan) {
    setSavingPlanEdit(true);
    setError(null);
    try {
      let onetimeAmount: number | null = null;
      if (editPlanForm.onetime_amount) {
        onetimeAmount = Number(editPlanForm.onetime_amount);
        if (!Number.isFinite(onetimeAmount) || onetimeAmount < 0) {
          setError("One-time amount must be non-negative");
          return;
        }
      }
      const mrp = editPlanForm.mrp ? Number(editPlanForm.mrp) : null;
      if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
        setError("MRP must be a non-negative number");
        return;
      }
      // Handle subscription / Stripe price
      let stripePriceId = editPlanForm.stripe_price_id.trim() || null;
      let recurringAmount: number | null = editPlanForm.recurring_amount ? Number(editPlanForm.recurring_amount) : null;
      let recurringCurrency: string | null = editPlanForm.recurring_currency || null;

      if (editPlanForm.has_subscription && !stripePriceId && editPlanForm.stripe_price_name.trim() && selected?.stripe_product_id) {
        // Create new Stripe price
        const recurAmt = Number(editPlanForm.recurring_amount);
        if (!Number.isFinite(recurAmt) || recurAmt <= 0) {
          setError("Recurring amount is required for subscription");
          return;
        }
        const stripePrice = await createStripePrice(
          selected.stripe_product_id,
          editPlanForm.stripe_price_name.trim(),
          recurAmt,
          editPlanForm.recurring_currency || "USD",
          editPlanForm.recurring_interval,
        );
        stripePriceId = stripePrice.id;
        recurringAmount = stripePrice.unit_amount ? stripePrice.unit_amount / 100 : recurAmt;
        recurringCurrency = stripePrice.currency.toUpperCase();
      }

      if (!editPlanForm.has_subscription) {
        stripePriceId = null;
        recurringAmount = null;
        recurringCurrency = null;
      }

      const r = await fetch(`/api/admin/pricing/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: editPlanForm.display_name.trim(),
          onetime_amount: onetimeAmount,
          onetime_currency: onetimeAmount !== null ? editPlanForm.onetime_currency : null,
          recurring_amount: recurringAmount,
          recurring_currency: recurringCurrency,
          recurring_interval: editPlanForm.has_subscription ? editPlanForm.recurring_interval : null,
          stripe_price_id: stripePriceId,
          stripe_price_name: editPlanForm.stripe_price_name.trim() || null,
          mrp,
          description: editPlanForm.description.trim() || null,
          html_description: editPlanForm.html_description.trim() || null,
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
  /* ---- Stripe product search ---- */
  async function searchStripeProducts(q: string) {
    setStripeProductQuery(q);
    if (!q.trim()) { setStripeProducts([]); setShowProductDropdown(false); return; }
    setStripeProductsLoading(true);
    setShowProductDropdown(true);
    try {
      const r = await fetch(`/api/admin/stripe/products?q=${encodeURIComponent(q)}`);
      const body = await r.json();
      if (r.ok) setStripeProducts(body.products as StripeProduct[]);
    } catch { /* ignore */ }
    finally { setStripeProductsLoading(false); }
  }

  function selectStripeProduct(product: StripeProduct) {
    setSelectedStripeProduct(product);
    setNewItem((prev) => ({ ...prev, stripe_product_name: product.name }));
    setStripeProductQuery(product.name);
    setShowProductDropdown(false);
  }

  /* ---- Stripe price search for a product ---- */
  async function loadStripePrices(productId: string) {
    setStripePricesLoading(true);
    try {
      const r = await fetch(`/api/admin/stripe/prices?product_id=${encodeURIComponent(productId)}`);
      const body = await r.json();
      if (r.ok) setStripePrices(body.prices as StripePrice[]);
    } catch { /* ignore */ }
    finally { setStripePricesLoading(false); }
  }

  function selectStripePrice(price: StripePrice) {
    const amount = price.unit_amount ? price.unit_amount / 100 : 0;
    setNewPlan((prev) => ({
      ...prev,
      stripe_price_id: price.id,
      stripe_price_name: price.nickname ?? "",
      recurring_amount: String(amount),
      recurring_currency: price.currency.toUpperCase() as "USD" | "INR",
      display_name: prev.display_name || price.nickname || "",
    }));
    setShowPriceDropdown(false);
  }

  /* ---- Create Stripe price during plan creation ---- */
  async function createStripePrice(productId: string, nickname: string, amount: number, currency: string, interval?: string) {
    const r = await fetch("/api/admin/stripe/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, nickname, amount, currency, ...(interval ? { recurring: { interval } } : {}) }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error ?? "Failed to create Stripe price");
    return body.price as StripePrice;
  }

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
                  <th className="py-2 pr-3">name</th>
                  <th className="py-2 pr-3 text-right">one-time</th>
                  <th className="py-2 pr-3 text-right">recurring</th>
                  <th className="py-2 pr-3 text-right">mrp</th>
                  <th className="py-2 pr-3">status</th>
                  <th className="py-2 text-center">toggle</th>
                  <th className="py-2 text-center">actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <React.Fragment key={plan.id}>
                  <tr className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{plan.display_name}</div>
                      {plan.description && <div className="text-xs text-muted-foreground truncate max-w-[220px]" title={plan.description}>{plan.description}</div>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                      {plan.onetime_amount != null ? `${plan.onetime_currency ?? "USD"} ${Number(plan.onetime_amount).toLocaleString()}` : "\u2014"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap">
                      {plan.recurring_amount != null ? `${plan.recurring_currency ?? "USD"} ${Number(plan.recurring_amount).toLocaleString()}/${plan.recurring_interval === "year" ? "yr" : "mo"}` : "\u2014"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">{plan.mrp != null ? `${plan.onetime_currency ?? plan.currency ?? "USD"} ${Number(plan.mrp).toLocaleString()}` : "\u2014"}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={plan.is_active ? "border-emerald-500/40 text-emerald-700" : "border-red-500/40 text-red-600"}>
                        {plan.is_active ? "active" : "inactive"}
                      </Badge>
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
                          <div className="space-y-1.5">
                            <Label className="text-xs">Display Name *</Label>
                            <Input value={editPlanForm.display_name} onChange={(e) => setEditPlanForm({ ...editPlanForm, display_name: e.target.value })} />
                            <p className="text-[11px] text-muted-foreground">Name shown to customers on signup pages.</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Stripe Price Name</Label>
                            <Input value={plan.stripe_price_name ?? ""} disabled className="opacity-60" />
                            <p className="text-[11px] text-muted-foreground">Locked — set when the Stripe price was created.</p>
                          </div>
                        </div>
                        {/* One-time payment */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">One-Time Amount</Label>
                            <Input type="number" min="0" step="0.01" value={editPlanForm.onetime_amount} onChange={(e) => setEditPlanForm({ ...editPlanForm, onetime_amount: e.target.value })} />
                            <p className="text-[11px] text-muted-foreground">One-time payment amount. Editable.</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">One-Time Currency</Label>
                            <Select value={editPlanForm.onetime_currency} onValueChange={(v) => setEditPlanForm({ ...editPlanForm, onetime_currency: v as "USD" | "INR" })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">Currency for one-time payment.</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">MRP</Label>
                            <Input type="number" min="0" step="0.01" placeholder="Original price" value={editPlanForm.mrp} onChange={(e) => setEditPlanForm({ ...editPlanForm, mrp: e.target.value })} />
                            <p className="text-[11px] text-muted-foreground">Strikethrough price shown to customers. Optional.</p>
                          </div>
                        </div>
                        {/* Subscription section */}
                        <div className="border-t pt-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={editPlanForm.has_subscription}
                              onCheckedChange={(v) => {
                                setEditPlanForm({ ...editPlanForm, has_subscription: v });
                                if (!v) {
                                  setEditPlanForm((prev) => ({ ...prev, has_subscription: false, stripe_price_id: "", stripe_price_name: "", recurring_amount: "", recurring_currency: "" }));
                                }
                              }}
                            />
                            <div>
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Has Subscription?</p>
                              <p className="text-[11px] text-muted-foreground">Enable to add or manage recurring billing via Stripe.</p>
                            </div>
                          </div>
                          {editPlanForm.has_subscription && (
                            <div className="pl-1 border-l-2 border-primary/20 ml-2">
                              <div className="pl-3 space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Stripe Price Name</Label>
                                  <div className="relative">
                                    <Input
                                      placeholder={selected?.stripe_product_id ? "Search existing or type new price name..." : "Set Stripe product on item first"}
                                      disabled={!selected?.stripe_product_id}
                                      value={editPlanForm.stripe_price_name}
                                      onChange={(e) => {
                                        setEditPlanForm({ ...editPlanForm, stripe_price_name: e.target.value, stripe_price_id: "", recurring_amount: "", recurring_currency: "" });
                                        if (selected?.stripe_product_id && e.target.value.trim()) {
                                          void loadStripePrices(selected.stripe_product_id);
                                          setShowPriceDropdown(true);
                                        } else {
                                          setShowPriceDropdown(false);
                                        }
                                      }}
                                      onFocus={() => { if (stripePrices.length > 0) setShowPriceDropdown(true); }}
                                      onBlur={() => setTimeout(() => setShowPriceDropdown(false), 200)}
                                    />
                                    {showPriceDropdown && (
                                      <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                                        {stripePricesLoading ? (
                                          <div className="p-3 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" />Loading prices...</div>
                                        ) : stripePrices.length === 0 ? (
                                          <div className="p-3 text-xs text-muted-foreground">No existing prices. A new one will be created.</div>
                                        ) : (
                                          stripePrices.filter((p) => !editPlanForm.stripe_price_name || (p.nickname ?? "").toLowerCase().includes(editPlanForm.stripe_price_name.toLowerCase())).map((p) => (
                                            <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onMouseDown={() => {
                                              const amt = p.unit_amount ? p.unit_amount / 100 : 0;
                                              setEditPlanForm((prev) => ({
                                                ...prev,
                                                stripe_price_id: p.id,
                                                stripe_price_name: p.nickname ?? "",
                                                recurring_amount: String(amt),
                                                recurring_currency: p.currency.toUpperCase(),
                                              }));
                                              setShowPriceDropdown(false);
                                            }}>
                                              <div className="font-medium">{p.nickname || p.id}</div>
                                              <div className="text-xs text-muted-foreground">{p.currency} {p.unit_amount ? (p.unit_amount / 100).toLocaleString() : 0} &middot; <span className="font-mono">{p.id}</span></div>
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {editPlanForm.stripe_price_id && <p className="text-xs text-muted-foreground">Linked: <span className="font-mono">{editPlanForm.stripe_price_id}</span></p>}
                                  {!editPlanForm.stripe_price_id && editPlanForm.stripe_price_name.trim() && <p className="text-xs text-muted-foreground">A new Stripe price will be created on save.</p>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Recurring Amount {!editPlanForm.stripe_price_id && "*"}</Label>
                                    <Input type="number" min="0" step="0.01" value={editPlanForm.recurring_amount} disabled={!!editPlanForm.stripe_price_id} className={editPlanForm.stripe_price_id ? "opacity-60" : ""} onChange={(e) => setEditPlanForm({ ...editPlanForm, recurring_amount: e.target.value })} />
                                    <p className="text-[11px] text-muted-foreground">{editPlanForm.stripe_price_id ? "Auto-filled from Stripe." : "Recurring amount per interval."}</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Currency</Label>
                                    <Select value={editPlanForm.recurring_currency || "USD"} disabled={!!editPlanForm.stripe_price_id} onValueChange={(v) => setEditPlanForm({ ...editPlanForm, recurring_currency: v })}>
                                      <SelectTrigger className={editPlanForm.stripe_price_id ? "opacity-60" : ""}><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">{editPlanForm.stripe_price_id ? "Set by Stripe." : "Currency for recurring payment."}</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Billing Interval</Label>
                                    <Select value={editPlanForm.recurring_interval} disabled={!!editPlanForm.stripe_price_id} onValueChange={(v) => setEditPlanForm({ ...editPlanForm, recurring_interval: v as "month" | "year" })}>
                                      <SelectTrigger className={editPlanForm.stripe_price_id ? "opacity-60" : ""}><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="month">Monthly</SelectItem><SelectItem value="year">Yearly</SelectItem></SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">{editPlanForm.stripe_price_id ? "Set by Stripe." : "How often the customer is charged."}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Input placeholder="Optional" value={editPlanForm.description} onChange={(e) => setEditPlanForm({ ...editPlanForm, description: e.target.value })} />
                          <p className="text-[11px] text-muted-foreground">Short plain text description.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">HTML Description</Label>
                          <HtmlEditor value={editPlanForm.html_description} onChange={(v: string) => setEditPlanForm({ ...editPlanForm, html_description: v })} />
                          <p className="text-[11px] text-muted-foreground">Rich content shown on signup/pricing pages.</p>
                        </div>
                        {/* Custom fields inline */}
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-medium">Custom Fields</Label>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Extra details displayed on signup pages (e.g. Members, Duration, Support level).</p>
                            </div>
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
                          <Button size="sm" variant="ghost" onClick={() => setEditPlanId(null)}>Cancel</Button>
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
    const hasStripePrice = !!newPlan.stripe_price_id;
    const hasProductId = !!selected?.stripe_product_id;
    return (
      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
        <div>
          <p className="text-sm font-medium">New Plan</p>
          <p className="text-xs text-muted-foreground mt-1">A plan is a specific pricing option under this item. It can be one-time only, subscription only, or both.</p>
        </div>

        {/* Section 1: Basic Info */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Display Name *</Label>
            <Input placeholder="e.g. Monthly Plan" value={newPlan.display_name} onChange={(e) => setNewPlan({ ...newPlan, display_name: e.target.value })} />
            <p className="text-[11px] text-muted-foreground">Name shown to customers on signup pages.</p>
          </div>
          <div className="space-y-1.5">
            <Label>MRP</Label>
            <Input type="number" min="0" step="0.01" placeholder="Original price" value={newPlan.mrp} onChange={(e) => setNewPlan({ ...newPlan, mrp: e.target.value })} />
            <p className="text-[11px] text-muted-foreground">Strikethrough price. Optional.</p>
          </div>
        </div>

        {/* Section 2: One-Time Payment */}
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">One-Time Payment</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>One-Time Amount</Label>
              <Input type="number" min="0" step="0.01" placeholder="e.g. 97.00" value={newPlan.onetime_amount} onChange={(e) => setNewPlan({ ...newPlan, onetime_amount: e.target.value })} />
              <p className="text-[11px] text-muted-foreground">Amount for one-time payment. Leave empty if this plan has no one-time fee.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={newPlan.onetime_currency} onValueChange={(v) => setNewPlan({ ...newPlan, onetime_currency: v as "USD" | "INR" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Currency for one-time payment.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Subscription Toggle */}
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center gap-3">
            <Switch checked={newPlan.has_subscription} onCheckedChange={(v) => setNewPlan({ ...newPlan, has_subscription: v })} />
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Has Subscription?</p>
              <p className="text-[11px] text-muted-foreground">Enable if this plan includes a recurring subscription via Stripe.</p>
            </div>
          </div>

          {newPlan.has_subscription && (
            <div className="space-y-3 pl-1 border-l-2 border-primary/20 ml-2">
              <div className="pl-3 space-y-3">
                {/* Stripe Price Name with search */}
                <div className="space-y-1.5">
                  <Label>Stripe Price Name</Label>
                  <div className="relative">
                    <Input
                      placeholder={hasProductId ? "Search existing or type new price name..." : "Set Stripe product on item first"}
                      disabled={!hasProductId}
                      value={newPlan.stripe_price_name}
                      onChange={(e) => {
                        setNewPlan({ ...newPlan, stripe_price_name: e.target.value, stripe_price_id: "", recurring_amount: "", recurring_currency: "USD" });
                        if (selected?.stripe_product_id && e.target.value.trim()) {
                          void loadStripePrices(selected.stripe_product_id);
                          setShowPriceDropdown(true);
                        } else {
                          setShowPriceDropdown(false);
                        }
                      }}
                      onFocus={() => { if (stripePrices.length > 0) setShowPriceDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowPriceDropdown(false), 200)}
                    />
                    {showPriceDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {stripePricesLoading ? (
                          <div className="p-3 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" />Loading prices...</div>
                        ) : stripePrices.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground">No existing prices. A new one will be created.</div>
                        ) : (
                          stripePrices.filter((p) => !newPlan.stripe_price_name || (p.nickname ?? "").toLowerCase().includes(newPlan.stripe_price_name.toLowerCase())).map((p) => (
                            <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onMouseDown={() => {
                              selectStripePrice(p);
                              setNewPlan((prev) => ({ ...prev, stripe_price_name: p.nickname ?? "" }));
                            }}>
                              <div className="font-medium">{p.nickname || p.id}</div>
                              <div className="text-xs text-muted-foreground">{p.currency} {p.unit_amount ? (p.unit_amount / 100).toLocaleString() : 0} &middot; <span className="font-mono">{p.id}</span></div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {hasStripePrice && <p className="text-xs text-muted-foreground">Linked: <span className="font-mono">{newPlan.stripe_price_id}</span></p>}
                  {!hasStripePrice && newPlan.stripe_price_name.trim() && hasProductId && <p className="text-xs text-muted-foreground">A new Stripe price will be created.</p>}
                  {!hasStripePrice && !newPlan.stripe_price_name.trim() && (
                    <p className="text-[11px] text-muted-foreground">Search existing prices or type a new name to create one.</p>
                  )}
                </div>
                {/* Recurring amount/currency/interval */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Recurring Amount {!hasStripePrice && "*"}</Label>
                    <Input type="number" min="0" step="0.01" value={newPlan.recurring_amount} disabled={hasStripePrice} onChange={(e) => setNewPlan({ ...newPlan, recurring_amount: e.target.value })} />
                    <p className="text-[11px] text-muted-foreground">{hasStripePrice ? "Auto-filled from Stripe." : "Recurring amount per interval."}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={newPlan.recurring_currency} disabled={hasStripePrice} onValueChange={(v) => setNewPlan({ ...newPlan, recurring_currency: v as "USD" | "INR" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem></SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">{hasStripePrice ? "Set by Stripe." : "Currency for recurring payment."}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Billing Interval</Label>
                    <Select value={newPlan.recurring_interval} disabled={hasStripePrice} onValueChange={(v) => setNewPlan({ ...newPlan, recurring_interval: v as "month" | "year" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="month">Monthly</SelectItem><SelectItem value="year">Yearly</SelectItem></SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">{hasStripePrice ? "Set by Stripe." : "How often the customer is charged."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input placeholder="Short plain text description" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} />
          <p className="text-[11px] text-muted-foreground">Short text shown under the plan name.</p>
        </div>
        <div className="space-y-1.5">
          <Label>HTML Description</Label>
          <HtmlEditor value={newPlan.html_description} onChange={(v: string) => setNewPlan({ ...newPlan, html_description: v })} />
          <p className="text-[11px] text-muted-foreground">Rich content shown on signup/pricing pages.</p>
        </div>

        {/* Custom fields */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Custom Fields</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">Extra details shown on signup pages.</p>
            </div>
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

      {/* Stripe account info */}
      {stripeAccount && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={stripeAccount.livemode ? "default" : "outline"} className={stripeAccount.livemode ? "bg-emerald-600" : "border-amber-500 text-amber-600"}>
                {stripeAccount.livemode ? "LIVE" : "TEST MODE"}
              </Badge>
              <span className="text-sm font-semibold">Stripe Configuration</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Business Name</p>
                <p className="font-medium">{stripeAccount.business_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Account ID</p>
                <p className="font-mono">{stripeAccount.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Email</p>
                <p>{stripeAccount.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Default Currency</p>
                <p className="font-medium">{stripeAccount.default_currency ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">API Key</p>
                <p className="font-mono">{stripeAccount.key_prefix}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] ${stripeAccount.charges_enabled ? "border-emerald-500/40 text-emerald-700" : "border-red-500/40 text-red-600"}`}>
                    Charges {stripeAccount.charges_enabled ? "OK" : "Off"}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${stripeAccount.payouts_enabled ? "border-emerald-500/40 text-emerald-700" : "border-red-500/40 text-red-600"}`}>
                    Payouts {stripeAccount.payouts_enabled ? "OK" : "Off"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add item form */}
      {showAddItem && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm font-medium">New Item</p>
              <p className="text-xs text-muted-foreground mt-1">An item is a product category (e.g. &ldquo;Mystery School&rdquo;, &ldquo;Perennial Mandalism&rdquo;). Each item can have multiple pricing plans under it.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-item-key">Item Key *</Label>
                <Input id="new-item-key" placeholder="e.g. mystery_school" className="font-mono text-sm" value={newItem.item_key} onChange={(e) => setNewItem({ ...newItem, item_key: e.target.value })} />
                <p className="text-[11px] text-muted-foreground">Unique machine-readable identifier. Use lowercase with underscores. Used in API calls: <code className="text-[10px]">/api/pricing/[item_key]</code></p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-item-name">Display Name *</Label>
                <Input id="new-item-name" placeholder="e.g. Mystery School" value={newItem.item_name} onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })} />
                <p className="text-[11px] text-muted-foreground">Human-readable name shown in the admin dashboard. Can differ from the Stripe product name.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-item-desc">Description</Label>
              <Input id="new-item-desc" placeholder="Optional description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
              <p className="text-[11px] text-muted-foreground">Internal description for admin reference. Not shown to customers.</p>
            </div>
            {/* Payment Account */}
            <div className="border-t pt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Provider</Label>
                  <Input value="stripe" disabled className="opacity-60" />
                  <p className="text-[11px] text-muted-foreground">Payment gateway for this item.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Account</Label>
                  <Input value={stripeAccount ? `${stripeAccount.business_name ?? "Stripe"} (${stripeAccount.id})` : "Loading..."} disabled className="opacity-60 text-xs" />
                  <p className="text-[11px] text-muted-foreground">The Stripe account this item will be linked to. Auto-set from current config.</p>
                </div>
              </div>
            </div>
            {/* Stripe Product */}
            <div className="border-t pt-3 space-y-1.5">
              <Label>Stripe Product Name</Label>
              <div className="relative">
                <Input
                  placeholder="Search existing or type new product name..."
                  value={stripeProductQuery || newItem.stripe_product_name}
                  onChange={(e) => {
                    setNewItem({ ...newItem, stripe_product_name: e.target.value });
                    setSelectedStripeProduct(null);
                    void searchStripeProducts(e.target.value);
                  }}
                  onFocus={() => { if (stripeProducts.length > 0) setShowProductDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                />
                {showProductDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {stripeProductsLoading ? (
                      <div className="p-3 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" />Searching Stripe...</div>
                    ) : stripeProducts.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground">No matching products. A new one will be created.</div>
                    ) : (
                      stripeProducts.map((p) => (
                        <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onMouseDown={() => selectStripeProduct(p)}>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.id}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedStripeProduct && (
                <p className="text-xs text-muted-foreground">Linked to existing: <span className="font-mono">{selectedStripeProduct.id}</span></p>
              )}
              {!selectedStripeProduct && newItem.stripe_product_name.trim() && (
                <p className="text-xs text-muted-foreground">A new Stripe product will be created.</p>
              )}
              {!selectedStripeProduct && !newItem.stripe_product_name.trim() && (
                <p className="text-[11px] text-muted-foreground">Type to search your existing Stripe products, or enter a new name to create one. This links the item to a Stripe Product for billing.</p>
              )}
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
                  <th className="py-2">account</th>
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
                      <td className="py-2 text-xs text-muted-foreground">
                        <div>{item.payment_provider ?? "stripe"}</div>
                        <div className="font-mono truncate max-w-[160px]" title={item.payment_provider_id ?? ""}>{item.payment_provider_id ?? "—"}</div>
                      </td>
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
                        <td colSpan={7} className="p-4 bg-muted/20 border-b">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Edit Item</h3>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedKey("")}><X className="size-4" /></Button>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                  <Label>Item Key</Label>
                                  <Input value={formItemKey} onChange={(e) => setFormItemKey(e.target.value)} className="font-mono text-sm" />
                                  <p className="text-[11px] text-muted-foreground">Unique identifier used in API calls. Changing this may break existing integrations.</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Display Name</Label>
                                  <Input value={formItemName} onChange={(e) => setFormItemName(e.target.value)} />
                                  <p className="text-[11px] text-muted-foreground">Human-readable name shown in the admin dashboard.</p>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Description (optional)</Label>
                                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                                <p className="text-[11px] text-muted-foreground">Internal description for admin reference.</p>
                              </div>
                              <div className="space-y-1.5">
                                <Label>HTML Description</Label>
                                <HtmlEditor value={formHtmlDescription} onChange={(v: string) => setFormHtmlDescription(v)} />
                                <p className="text-[11px] text-muted-foreground">Rich content shown on signup/landing pages.</p>
                              </div>
                              {/* Payment & Stripe info (read-only) */}
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t pt-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Payment Provider</Label>
                                  <Input value={selected.payment_provider ?? "stripe"} disabled className="opacity-60" />
                                  <p className="text-[11px] text-muted-foreground">The payment gateway used for this item.</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Provider Account ID</Label>
                                  <Input value={selected.payment_provider_id ?? "—"} disabled className="opacity-60 font-mono text-xs" />
                                  <p className="text-[11px] text-muted-foreground">Account ID on the payment provider.</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Stripe Product Name</Label>
                                  <Input value={selected.stripe_product_name ?? "Not linked"} disabled className="opacity-60" />
                                  <p className="text-[11px] text-muted-foreground">Locked — set when the item was created.</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Stripe Product ID</Label>
                                  <Input value={selected.stripe_product_id ?? "—"} disabled className="opacity-60 font-mono text-xs" />
                                  <p className="text-[11px] text-muted-foreground">Auto-generated by Stripe.</p>
                                </div>
                              </div>
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
                          <tr><td colSpan={7} className="py-3 pl-10"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Loading plans...</div></td></tr>
                        ) : (itemPlansCache[item.id] ?? []).length === 0 ? (
                          <tr><td colSpan={7} className="py-3 pl-10"><p className="text-xs text-muted-foreground italic">No plans for this item.</p></td></tr>
                        ) : (
                          (itemPlansCache[item.id] ?? []).map((plan, idx, arr) => (
                            <tr key={plan.id} className={idx === arr.length - 1 ? "border-b" : ""}>
                              <td className="py-1.5 text-right pr-1 text-muted-foreground text-xs">{idx === arr.length - 1 ? "\u2514" : "\u251C"}</td>
                              <td className="py-1.5 font-mono text-xs text-muted-foreground" title={plan.plan_id}>{plan.plan_id}</td>
                              <td className="py-1.5">
                                <span className="text-xs">{plan.display_name}</span>
                                <span className="ml-2 text-xs tabular-nums font-medium">{plan.onetime_amount != null ? `${plan.onetime_currency ?? "USD"} ${Number(plan.onetime_amount).toLocaleString()}` : plan.recurring_amount != null ? `${plan.recurring_currency ?? "USD"} ${Number(plan.recurring_amount).toLocaleString()}/mo` : `${plan.currency ?? "USD"} ${Number(plan.amount ?? 0).toLocaleString()}`}</span>
                                {plan.mrp != null && <span className="ml-1 text-xs tabular-nums text-muted-foreground line-through">{Number(plan.mrp).toLocaleString()}</span>}
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
