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
import { DollarSign, Loader2, Save, AlertCircle, RefreshCcw } from "lucide-react";

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

  // Sync form state when selection changes
  useEffect(() => {
    if (selected) {
      setFormPrice(String(selected.price));
      setFormCurrency(selected.currency);
      setFormItemName(selected.item_name);
      setFormDescription(selected.description ?? "");
    }
  }, [selected]);

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

  return (
    <div className="space-y-6 max-w-4xl">
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

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

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
                <SelectValue placeholder={loading ? "Loading…" : "Select an item"} />
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
                            : "border-muted-foreground/40 text-muted-foreground"
                        }
                      >
                        {i.is_active ? "active" : "inactive"}
                      </Badge>
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
