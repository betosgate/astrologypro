"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DivinerPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: string;
  stripe_price_id: string | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  active_subscriber_count: number;
}

interface DivinerAddon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: string;
  stripe_price_id: string | null;
  feature_key: string;
  is_active: boolean;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number, currency: string, interval: string): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars} ${currency.toUpperCase()} / ${interval}`;
}

function FeatureChips({ features }: { features: string[] }) {
  const visible = features.slice(0, 4);
  const extra = features.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((f) => (
        <Badge key={f} variant="secondary" className="text-xs font-mono">
          {f}
        </Badge>
      ))}
      {extra > 0 && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          +{extra} more
        </Badge>
      )}
    </div>
  );
}

// ─── Plans tab ─────────────────────────────────────────────────────────────────

function PlansTab() {
  const [plans, setPlans] = useState<DivinerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price_cents: 0,
    currency: "usd",
    billing_interval: "month",
    stripe_price_id: "",
    features: "",
    is_active: true,
    sort_order: 0,
  });

  async function loadPlans() {
    setLoading(true);
    const res = await fetch("/api/admin/diviner-plans");
    if (res.ok) {
      const json = await res.json();
      setPlans(json.plans ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleCreate() {
    setSaving(true);
    const featuresArr = form.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const res = await fetch("/api/admin/diviner-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        features: featuresArr,
        price_cents: Number(form.price_cents),
        sort_order: Number(form.sort_order),
        stripe_price_id: form.stripe_price_id || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setShowCreate(false);
      setForm({
        name: "",
        slug: "",
        description: "",
        price_cents: 0,
        currency: "usd",
        billing_interval: "month",
        stripe_price_id: "",
        features: "",
        is_active: true,
        sort_order: 0,
      });
      await loadPlans();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage SaaS plan definitions available to diviners.
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 size-4" />
          New Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right">Active Diviners</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No plans found.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{plan.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(plan.price_cents, plan.currency, plan.billing_interval)}
                    </TableCell>
                    <TableCell>
                      <FeatureChips features={plan.features} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {plan.active_subscriber_count}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Name</Label>
                <Input
                  id="plan-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Starter"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-slug">Slug</Label>
                <Input
                  id="plan-slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="starter"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-desc">Description</Label>
              <Textarea
                id="plan-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-price">Price (cents)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min={0}
                  value={form.price_cents}
                  onChange={(e) => setForm((f) => ({ ...f, price_cents: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-currency">Currency</Label>
                <Input
                  id="plan-currency"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-interval">Interval</Label>
                <Input
                  id="plan-interval"
                  value={form.billing_interval}
                  onChange={(e) => setForm((f) => ({ ...f, billing_interval: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-features">
                Feature keys{" "}
                <span className="text-muted-foreground font-normal">(comma-separated)</span>
              </Label>
              <Textarea
                id="plan-features"
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                placeholder="public_profile,booking_system,analytics"
                rows={2}
                className="font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-sort">Sort Order</Label>
                <Input
                  id="plan-sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="plan-active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <Label htmlFor="plan-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Add-ons tab ───────────────────────────────────────────────────────────────

function AddOnsTab() {
  const [addons, setAddons] = useState<DivinerAddon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAddons() {
      setLoading(true);
      // Fetch all active add-ons via a direct admin query (no per-diviner filter)
      const res = await fetch("/api/admin/diviner-plans/addons-list");
      if (res.ok) {
        const json = await res.json();
        setAddons(json.addons ?? []);
      }
      setLoading(false);
    }
    loadAddons();
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Global add-on catalog. Assign add-ons to individual diviners from their detail page.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Feature Key</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No add-ons found.
                  </TableCell>
                </TableRow>
              ) : (
                addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        <p className="text-xs text-muted-foreground">{addon.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(addon.price_cents, addon.currency, addon.billing_interval)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {addon.feature_key}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={addon.is_active ? "default" : "secondary"}>
                        {addon.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function DivinerPlansClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diviner Plans</h1>
        <p className="text-muted-foreground">
          Manage SaaS subscription plans and add-ons for diviners.
        </p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="addons">Add-Ons</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Catalog</CardTitle>
              <CardDescription>
                Subscription plans available for diviners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlansTab />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="addons" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add-On Catalog</CardTitle>
              <CardDescription>
                Optional add-ons that extend plan features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddOnsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
