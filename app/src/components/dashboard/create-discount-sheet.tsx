"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CreateDiscountSheetProps {
  divinerId: string;
}

const EMPTY_FORM = {
  name: "",
  type: "session_count" as "session_count" | "package",
  discount_percent: 10,
  min_sessions: "" as string | number,
  is_active: true,
};

export function CreateDiscountSheet({ divinerId }: CreateDiscountSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.discount_percent <= 0 || form.discount_percent > 100) {
      toast.error("Discount must be between 1% and 100%");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diviner_id: divinerId,
        name: form.name.trim(),
        type: form.type,
        discount_percent: form.discount_percent,
        min_sessions:
          form.type === "session_count" && form.min_sessions !== ""
            ? Number(form.min_sessions)
            : null,
        is_active: form.is_active,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to create discount");
      return;
    }

    toast.success("Discount rule created");
    setForm({ ...EMPTY_FORM });
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Create Discount
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Discount Rule</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="discount-name">Rule Name</Label>
            <Input
              id="discount-name"
              placeholder="e.g. Loyalty 5-Session Discount"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  type: v as "session_count" | "package",
                  min_sessions: "",
                })
              }
            >
              <SelectTrigger id="discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session_count">
                  Session Count — after N sessions
                </SelectItem>
                <SelectItem value="package">
                  Package — applied to bundled bookings
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-percent">Discount (%)</Label>
            <Input
              id="discount-percent"
              type="number"
              min={1}
              max={100}
              value={form.discount_percent}
              onChange={(e) =>
                setForm({ ...form, discount_percent: Number(e.target.value) })
              }
            />
          </div>

          {form.type === "session_count" && (
            <div className="space-y-2">
              <Label htmlFor="discount-min-sessions">
                Minimum Sessions Completed
              </Label>
              <Input
                id="discount-min-sessions"
                type="number"
                min={1}
                placeholder="e.g. 5"
                value={form.min_sessions}
                onChange={(e) =>
                  setForm({ ...form, min_sessions: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Client receives this discount after completing this many sessions
                with you.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="discount-active">Active</Label>
            <Switch
              id="discount-active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Creating..." : "Create Rule"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
