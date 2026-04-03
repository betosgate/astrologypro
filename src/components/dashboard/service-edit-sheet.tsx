"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  is_featured: boolean;
}

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  category: string;
  base_price?: number;
}

interface ServiceEditSheetProps {
  service?: ServiceData;
  mode?: "create" | "edit";
  divinerId?: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  duration: 60,
  price: 0,
  overage_rate: 0,
  featured: false,
  category: "",
};

export function ServiceEditSheet({
  service,
  mode = "edit",
  divinerId,
}: ServiceEditSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [priceLimits, setPriceLimits] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [form, setForm] = useState(
    service
      ? {
          name: service.name,
          description: service.description ?? "",
          duration: service.duration_minutes,
          price: service.base_price,
          overage_rate: 0,
          featured: service.is_featured,
          category: "",
        }
      : { ...EMPTY_FORM }
  );

  // Fetch service templates for create mode, or price limits for edit mode
  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      const supabase = createClient();

      if (mode === "create") {
        const { data: templateData } = await supabase
          .from("service_templates")
          .select("*")
          .order("name");

        if (templateData) {
          setTemplates(templateData);
        }
      } else if (service) {
        // Edit mode: fetch price limits from matching template
        const { data: template } = await supabase
          .from("service_templates")
          .select("base_price")
          .eq("name", service.name)
          .maybeSingle();

        if (template) {
          setPriceLimits({
            min: (template.base_price ?? 0) * 0.5,
            max: (template.base_price ?? 0) * 2,
          });
        }
      }
    }

    fetchData();
  }, [open, mode, service]);

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setForm({
      name: template.name,
      description: template.description ?? "",
      duration: template.duration_minutes,
      price: template.base_price ?? 0,
      overage_rate: 0,
      featured: false,
      category: template.category,
    });

    // Set price limits from template
    setPriceLimits({
      min: (template.base_price ?? 0) * 0.5,
      max: (template.base_price ?? 0) * 2,
    });
    setPriceError(null);
  }

  function validatePrice(price: number): string | null {
    if (!priceLimits) return null;
    if (price < priceLimits.min) {
      return `Price must be at least $${priceLimits.min.toFixed(2)}`;
    }
    if (price > priceLimits.max) {
      return `Price cannot exceed $${priceLimits.max.toFixed(2)} (200% of base)`;
    }
    return null;
  }

  function handlePriceChange(newPrice: number) {
    setForm({ ...form, price: newPrice });
    setPriceError(validatePrice(newPrice));
  }

  async function handleSave() {
    // Final validation before save
    const error = validatePrice(form.price);
    if (error) {
      setPriceError(error);
      toast.error(error);
      return;
    }

    if (!form.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (mode === "create") {
      if (!divinerId) {
        toast.error("Cannot create service: missing diviner ID");
        setSaving(false);
        return;
      }

      // Generate a slug from the name
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error: insertError } = await supabase.from("services").insert({
        diviner_id: divinerId,
        name: form.name,
        slug,
        description: form.description || null,
        duration_minutes: form.duration,
        base_price: form.price,
        overage_rate: form.overage_rate,
        is_featured: form.featured,
        is_active: true,
        category: form.category || "astrology",
      });

      setSaving(false);

      if (insertError) {
        toast.error("Failed to create service");
        console.error("Insert error:", insertError);
        return;
      }

      toast.success("Service created");
      // Reset form for next creation
      setForm({ ...EMPTY_FORM });
      setSelectedTemplateId("");
    } else {
      // Edit mode
      const { error: updateError } = await supabase
        .from("services")
        .update({
          name: form.name,
          description: form.description || null,
          duration_minutes: form.duration,
          base_price: form.price,
          overage_rate: form.overage_rate,
          is_featured: form.featured,
        })
        .eq("id", service!.id);

      setSaving(false);

      if (updateError) {
        toast.error("Failed to update service");
        return;
      }

      toast.success("Service updated");
    }

    setOpen(false);
    router.refresh();
  }

  const isCreate = mode === "create";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isCreate ? (
          <Button className="gap-2">
            <Plus className="size-4" />
            Add New Service
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Pencil className="size-4" />
            <span className="sr-only">Edit service</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isCreate ? "Add New Service" : "Edit Service"}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          {/* Template selector (create mode only) */}
          {isCreate && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Start from a template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template to pre-fill..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} &mdash; {t.duration_minutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a template to pre-fill the fields below, then customize
                as needed.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-description">Description</Label>
            <Textarea
              id="service-description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duration (min)</Label>
              <select
                id="service-duration"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Price ($)</Label>
              <Input
                id="service-price"
                type="number"
                min={priceLimits?.min ?? 0}
                max={priceLimits?.max ?? undefined}
                step={0.01}
                value={form.price}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className={priceError ? "border-red-500" : ""}
              />
              {priceError && (
                <p className="text-xs text-red-500">{priceError}</p>
              )}
              {priceLimits && !priceError && (
                <p className="text-xs text-muted-foreground">
                  Minimum: ${priceLimits.min.toFixed(2)} | Maximum: $
                  {priceLimits.max.toFixed(2)} (200% of base)
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-overage">Overage Rate ($/min)</Label>
            <Input
              id="service-overage"
              type="number"
              min={0}
              step={0.01}
              value={form.overage_rate}
              onChange={(e) =>
                setForm({ ...form, overage_rate: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="service-featured">Featured</Label>
            <Switch
              id="service-featured"
              checked={form.featured}
              onCheckedChange={(checked) =>
                setForm({ ...form, featured: !!checked })
              }
            />
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={handleSave}
            disabled={saving || !!priceError}
            className="w-full"
          >
            {saving
              ? "Saving..."
              : isCreate
                ? "Create Service"
                : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
