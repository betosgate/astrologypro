"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

type Category = { id: string; title: string };

const STATUS_OPTIONS = ["active", "inactive"] as const;

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mrp, setMrp] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [preorderPrice, setPreorderPrice] = useState("");
  const [priority, setPriority] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [detailsImageUrl, setDetailsImageUrl] = useState("");

  useEffect(() => {
    fetch("/api/admin/perennial-content/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/admin/perennial-content/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        mrp: Number(mrp),
        offer_price: Number(offerPrice),
        preorder_price: Number(preorderPrice),
        priority,
        category_id: categoryId || null,
        status,
        main_image_url: mainImageUrl || null,
        details_image_url: detailsImageUrl || null,
        is_visible: true,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create product");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(
      () => router.push("/admin/perennial-content/products"),
      800
    );
  }

  function handleReset() {
    setName("");
    setDescription("");
    setMrp("");
    setOfferPrice("");
    setPreorderPrice("");
    setPriority(0);
    setCategoryId("");
    setStatus("active");
    setMainImageUrl("");
    setDetailsImageUrl("");
    setError(null);
    setSuccess(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/perennial-content/products">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground">
            Create a new perennial product
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Product name"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Product description"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  MRP <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Offer Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Preorder Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={preorderPrice}
                  onChange={(e) => setPreorderPrice(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={categoryId || "none"}
                  onValueChange={(value) => setCategoryId(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="none">Select Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {STATUS_OPTIONS.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>Main Image URL</Label>
                <Input
                  value={mainImageUrl}
                  onChange={(e) => setMainImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                {mainImageUrl && (
                  <img
                    src={mainImageUrl}
                    alt="Main preview"
                    className="mt-2 max-h-32 rounded object-contain"
                  />
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>Details Page Image URL</Label>
                <Input
                  value={detailsImageUrl}
                  onChange={(e) => setDetailsImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                {detailsImageUrl && (
                  <img
                    src={detailsImageUrl}
                    alt="Details preview"
                    className="mt-2 max-h-32 rounded object-contain"
                  />
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Product created successfully!
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Creating..." : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/admin/perennial-content/products">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
