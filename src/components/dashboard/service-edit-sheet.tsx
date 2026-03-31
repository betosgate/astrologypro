"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

interface ServiceEditSheetProps {
  service: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    overage_rate: number | null;
    featured: boolean;
  };
}

export function ServiceEditSheet({ service }: ServiceEditSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: service.name,
    description: service.description ?? "",
    duration: service.duration,
    price: service.price / 100,
    overage_rate: (service.overage_rate ?? 0) / 100,
    featured: service.featured,
  });

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("services")
      .update({
        name: form.name,
        description: form.description || null,
        duration: form.duration,
        price: Math.round(form.price * 100),
        overage_rate: Math.round(form.overage_rate * 100),
        featured: form.featured,
      })
      .eq("id", service.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update service");
      return;
    }

    toast.success("Service updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
          <span className="sr-only">Edit service</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Service</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
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
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
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
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
