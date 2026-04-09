"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PricingItem {
  id: string;
  item_key: string;
  item_name: string;
  price: number;
  currency: "USD" | "INR";
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const [formPrice, setFormPrice] = useState<string>("");
  const [formCurrency, setFormCurrency] = useState<"USD" | "INR">("INR");
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
  });
  const [addingPlan, setAddingPlan] = useState(false);

  /* ---- Load items ---- */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/pricing");
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setItems(body.items as PricingItem[]);
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
      setFormPrice(String(selected.price));
      setFormCurrency(selected.currency);
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
      const priceNum = Number(formPrice);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        setError("Price must be a non-negative number");
        return;
      }
      const r = await fetch(`/api/admin/pricing/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: priceNum,
          currency: formCurrency,
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
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? (body.plan as PricingPlan) : p)),
      );
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
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setPlans((prev) => [...prev, body.plan as PricingPlan]);
      setNewPlan({ display_name: "", amount: "", mrp: "", stripe_price_id: "", currency: "INR", description: "" });
      setShowAddPlan(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingPlan(false);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlanSavingId(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <DollarSign className="size-7 text-primary mt-1" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pricing Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Edit prices for purchasable items across the app. Signup pages
              read these values via <code className="text-xs">/api/pricing/[itemKey]</code>.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCcw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
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

      {/* Edit pricing item */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit pricing</CardTitle>
          <CardDescription className="text-xs">
            Pick a purchasable item from the dropdown to view and edit its current price.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pricing-item">Item</Label>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger id="pricing-item">
                <SelectValue placeholder={loading ? "Loading\u2026" : "Select an item"} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.item_key}>
                    {item.item_name} ({item.item_key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pricing-name">Display name</Label>
                  <Input
                    id="pricing-name"
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="pricing-price">Price</Label>
                    <Input
                      id="pricing-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pricing-currency">Currency</Label>
                    <Select
                      value={formCurrency}
                      onValueChange={(v) => setFormCurrency(v as "USD" | "INR")}
                    >
                      <SelectTrigger id="pricing-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pricing-desc">Description (optional)</Label>
                <Input
                  id="pricing-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="pricing-active"
                    checked={selected.is_active}
                    disabled={togglingId === selected.id}
                    onCheckedChange={() => handleToggleActive(selected)}
                  />
                  <Label htmlFor="pricing-active" className="text-sm cursor-pointer">
                    {selected.is_active ? "Active" : "Inactive"}
                  </Label>
                  {togglingId === selected.id && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  <Save className="mr-2 size-4" />
                  Save Price
                </Button>
                {savedFlash && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                    Saved
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Last updated: {new Date(selected.updated_at).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plans for selected item */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Plans for &ldquo;{selected.item_name}&rdquo;
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Each item can have multiple purchasable plans with different pricing.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPlan(!showAddPlan)}
              >
                <Plus className="mr-2 size-4" />
                Add Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add plan form */}
            {showAddPlan && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-medium">New Plan</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-plan-name">Display Name *</Label>
                    <Input
                      id="new-plan-name"
                      placeholder="e.g. Monthly Plan"
                      value={newPlan.display_name}
                      onChange={(e) => setNewPlan({ ...newPlan, display_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-plan-stripe">Stripe Price ID</Label>
                    <Input
                      id="new-plan-stripe"
                      placeholder="price_..."
                      value={newPlan.stripe_price_id}
                      onChange={(e) => setNewPlan({ ...newPlan, stripe_price_id: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-plan-amount">Amount *</Label>
                    <Input
                      id="new-plan-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPlan.amount}
                      onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-plan-mrp">MRP</Label>
                    <Input
                      id="new-plan-mrp"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Original price"
                      value={newPlan.mrp}
                      onChange={(e) => setNewPlan({ ...newPlan, mrp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-plan-currency">Currency</Label>
                    <Select
                      value={newPlan.currency}
                      onValueChange={(v) => setNewPlan({ ...newPlan, currency: v as "USD" | "INR" })}
                    >
                      <SelectTrigger id="new-plan-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-plan-desc">Description</Label>
                  <Input
                    id="new-plan-desc"
                    placeholder="Optional plan description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleAddPlan} disabled={addingPlan || !newPlan.display_name.trim()}>
                    {addingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Create Plan
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddPlan(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

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
                      <th className="py-2 text-center">toggle</th>
                      <th className="py-2 text-center">actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs max-w-[140px] truncate" title={plan.plan_id}>
                          {plan.plan_id}
                        </td>
                        <td className="py-2">
                          <div>{plan.display_name}</div>
                          {plan.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={plan.description}>
                              {plan.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {plan.currency} {plan.amount.toLocaleString()}
                        </td>
                        <td className="py-2 text-right tabular-nums text-muted-foreground">
                          {plan.mrp !== null ? `${plan.currency} ${plan.mrp.toLocaleString()}` : "\u2014"}
                        </td>
                        <td className="py-2 font-mono text-xs max-w-[120px] truncate" title={plan.stripe_price_id ?? ""}>
                          {plan.stripe_price_id ?? "\u2014"}
                        </td>
                        <td className="py-2">
                          <Badge
                            variant="outline"
                            className={
                              plan.is_active
                                ? "border-emerald-500/40 text-emerald-700"
                                : "border-red-500/40 text-red-600"
                            }
                          >
                            {plan.is_active ? "active" : "inactive"}
                          </Badge>
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={plan.is_active}
                              disabled={planTogglingId === plan.id}
                              onCheckedChange={() => handleTogglePlan(plan)}
                              aria-label={`Toggle ${plan.display_name} active status`}
                            />
                            {planTogglingId === plan.id && (
                              <Loader2 className="size-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={planSavingId === plan.id}
                            onClick={() => handleDeletePlan(plan)}
                          >
                            {planSavingId === plan.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All pricing items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All pricing rows
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No pricing rows yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">item_key</th>
                  <th className="py-2">name</th>
                  <th className="py-2 text-right">price</th>
                  <th className="py-2">status</th>
                  <th className="py-2 text-center">toggle</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{i.item_key}</td>
                    <td className="py-2">{i.item_name}</td>
                    <td className="py-2 text-right tabular-nums">
                      {i.currency} {i.price.toLocaleString()}
                    </td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={
                          i.is_active
                            ? "border-emerald-500/40 text-emerald-700"
                            : "border-red-500/40 text-red-600"
                        }
                      >
                        {i.is_active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={i.is_active}
                          disabled={togglingId === i.id}
                          onCheckedChange={() => handleToggleActive(i)}
                          aria-label={`Toggle ${i.item_name} active status`}
                        />
                        {togglingId === i.id && (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
