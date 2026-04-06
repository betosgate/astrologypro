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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus, Copy, Check } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PmTier = {
  id: string;
  name: string;
  description: string | null;
  base_price_usd: number;
  base_member_limit: number;
  extra_per_member_usd: number;
  max_total_members: number;
  stripe_price_id: string | null;
  stripe_extra_price_id: string | null;
  is_active: boolean;
  display_order: number;
  member_count: number;
  created_at: string;
  updated_at: string;
};

type TierFormState = {
  name: string;
  description: string;
  base_price_usd: string;
  base_member_limit: string;
  extra_per_member_usd: string;
  max_total_members: string;
  stripe_price_id: string;
  stripe_extra_price_id: string;
  display_order: string;
  is_active: boolean;
};

const EMPTY_FORM: TierFormState = {
  name: "",
  description: "",
  base_price_usd: "0",
  base_member_limit: "3",
  extra_per_member_usd: "0",
  max_total_members: "10",
  stripe_price_id: "",
  stripe_extra_price_id: "",
  display_order: "0",
  is_active: true,
};

function tierToForm(t: PmTier): TierFormState {
  return {
    name: t.name,
    description: t.description ?? "",
    base_price_usd: String(t.base_price_usd),
    base_member_limit: String(t.base_member_limit),
    extra_per_member_usd: String(t.extra_per_member_usd),
    max_total_members: String(t.max_total_members),
    stripe_price_id: t.stripe_price_id ?? "",
    stripe_extra_price_id: t.stripe_extra_price_id ?? "",
    display_order: String(t.display_order),
    is_active: t.is_active,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number) {
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── CopyMonoField ─────────────────────────────────────────────────────────────

function CopyMonoField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-muted-foreground text-xs italic">—</span>;

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground hover:bg-muted/70 transition-colors"
      title="Click to copy"
    >
      <span className="max-w-[160px] truncate">{value}</span>
      {copied ? (
        <Check className="size-3 text-green-500 shrink-0" />
      ) : (
        <Copy className="size-3 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}

// ─── TierDialog ────────────────────────────────────────────────────────────────

function TierDialog({
  open,
  onClose,
  editTier,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editTier: PmTier | null;
  onSaved: () => void;
}) {
  const isEdit = !!editTier;
  const [form, setForm] = useState<TierFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTier ? tierToForm(editTier) : EMPTY_FORM);
      setError(null);
    }
  }, [open, editTier]);

  function set(key: keyof TierFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      base_price_usd: parseFloat(form.base_price_usd),
      base_member_limit: parseInt(form.base_member_limit, 10),
      extra_per_member_usd: parseFloat(form.extra_per_member_usd),
      max_total_members: parseInt(form.max_total_members, 10),
      stripe_price_id: form.stripe_price_id.trim() || null,
      stripe_extra_price_id: form.stripe_extra_price_id.trim() || null,
      display_order: parseInt(form.display_order, 10) || 0,
      is_active: form.is_active,
    };

    if (!payload.name) { setError("Name is required."); return; }
    if (isNaN(payload.base_price_usd) || payload.base_price_usd < 0) { setError("Base price must be a valid non-negative number."); return; }
    if (isNaN(payload.base_member_limit) || payload.base_member_limit < 1) { setError("Members included must be >= 1."); return; }
    if (isNaN(payload.extra_per_member_usd) || payload.extra_per_member_usd < 0) { setError("Extra per member must be a valid non-negative number."); return; }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/pm-plan-tiers/${editTier!.id}`
        : "/api/admin/pm-plan-tiers";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save tier."); return; }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tier" : "Add Tier"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tier-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Starter, Family, Extended"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-desc">Description</Label>
            <Textarea
              id="tier-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Brief description shown to members"
            />
          </div>

          {/* Base price + Members included */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tier-base-price">Base Price (USD/mo)</Label>
              <Input
                id="tier-base-price"
                type="number"
                min={0}
                step={0.01}
                value={form.base_price_usd}
                onChange={(e) => set("base_price_usd", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier-base-limit">Members Included</Label>
              <Input
                id="tier-base-limit"
                type="number"
                min={1}
                step={1}
                value={form.base_member_limit}
                onChange={(e) => set("base_member_limit", e.target.value)}
              />
            </div>
          </div>

          {/* Extra per member + Max total */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tier-extra-price">Extra per Member (USD/mo)</Label>
              <Input
                id="tier-extra-price"
                type="number"
                min={0}
                step={0.01}
                value={form.extra_per_member_usd}
                onChange={(e) => set("extra_per_member_usd", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier-max">Max Total Members</Label>
              <Input
                id="tier-max"
                type="number"
                min={1}
                step={1}
                value={form.max_total_members}
                onChange={(e) => set("max_total_members", e.target.value)}
              />
            </div>
          </div>

          {/* Stripe IDs */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-stripe-base">Stripe Base Price ID</Label>
            <Input
              id="tier-stripe-base"
              value={form.stripe_price_id}
              onChange={(e) => set("stripe_price_id", e.target.value)}
              placeholder="price_..."
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tier-stripe-extra">Stripe Extra Price ID</Label>
            <Input
              id="tier-stripe-extra"
              value={form.stripe_extra_price_id}
              onChange={(e) => set("stripe_extra_price_id", e.target.value)}
              placeholder="price_..."
              className="font-mono text-sm"
            />
          </div>

          {/* Display order */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-order">Display Order</Label>
            <Input
              id="tier-order"
              type="number"
              step={1}
              value={form.display_order}
              onChange={(e) => set("display_order", e.target.value)}
            />
          </div>

          {/* Is active */}
          <div className="flex items-center gap-3">
            <Switch
              id="tier-active"
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", v)}
            />
            <Label htmlFor="tier-active" className="cursor-pointer">
              Active (visible to members)
            </Label>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create tier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PmPlanTiersPage() {
  const [tiers, setTiers] = useState<PmTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTier, setEditTier] = useState<PmTier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; msg: string } | null>(null);

  async function loadTiers() {
    setLoading(true);
    const res = await fetch("/api/admin/pm-plan-tiers");
    if (res.ok) {
      const json = await res.json();
      setTiers(json.tiers ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadTiers(); }, []);

  function openCreate() {
    setEditTier(null);
    setDialogOpen(true);
  }

  function openEdit(tier: PmTier) {
    setEditTier(tier);
    setDialogOpen(true);
  }

  async function handleDelete(tier: PmTier) {
    setDeleteError(null);
    setDeletingId(tier.id);
    try {
      const res = await fetch(`/api/admin/pm-plan-tiers/${tier.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setDeleteError({ id: tier.id, msg: json.error ?? "Failed to delete." });
        return;
      }
      await loadTiers();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PM Plan Tiers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure Perennial Mandalism membership pricing
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="size-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && tiers.length === 0 && (
        <Card className="py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground text-sm">No plan tiers yet.</p>
            <Button onClick={openCreate} className="mt-4" variant="outline">
              <Plus className="size-4 mr-2" />
              Create your first tier
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tier cards */}
      {!loading && tiers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <Card key={tier.id} className="relative flex flex-col">
              {/* Active badge */}
              <div className="absolute top-3 right-3">
                {tier.is_active ? (
                  <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-muted-foreground text-muted-foreground text-xs">
                    Inactive
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-2 pr-20">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                {tier.description && (
                  <CardDescription className="text-sm leading-snug">
                    {tier.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex flex-col gap-3 flex-1">
                {/* Price */}
                <div>
                  <span className="text-3xl font-bold">${fmt(tier.base_price_usd)}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>

                {/* Details */}
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="text-foreground font-medium">
                    Includes {tier.base_member_limit} member{tier.base_member_limit !== 1 ? "s" : ""}
                  </li>
                  {tier.extra_per_member_usd > 0 && (
                    <li>Each extra member: ${fmt(tier.extra_per_member_usd)}/mo</li>
                  )}
                  <li>Max {tier.max_total_members} members total</li>
                  <li>Display order: {tier.display_order}</li>
                </ul>

                {/* Member count badge */}
                <div>
                  <Badge variant="secondary" className="text-xs">
                    {tier.member_count} active member{tier.member_count !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Stripe IDs */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Stripe Base Price
                  </p>
                  <CopyMonoField value={tier.stripe_price_id ?? ""} />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
                    Stripe Extra Price
                  </p>
                  <CopyMonoField value={tier.stripe_extra_price_id ?? ""} />
                </div>

                {/* Delete error for this card */}
                {deleteError?.id === tier.id && (
                  <p className="text-xs text-destructive rounded bg-destructive/10 px-2 py-1">
                    {deleteError.msg}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEdit(tier)}
                  >
                    <Pencil className="size-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    disabled={tier.member_count > 0 || deletingId === tier.id}
                    onClick={() => handleDelete(tier)}
                    title={
                      tier.member_count > 0
                        ? `Cannot delete: ${tier.member_count} active member(s) on this tier`
                        : "Delete tier"
                    }
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    {deletingId === tier.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <TierDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editTier={editTier}
        onSaved={loadTiers}
      />
    </div>
  );
}
