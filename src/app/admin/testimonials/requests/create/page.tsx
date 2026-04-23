"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";

type Diviner = { id: string; display_name: string };

export default function CreateTestimonialRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [diviners, setDiviners] = useState<Diviner[]>([]);

  const [form, setForm] = useState({
    requested_to_name: "",
    requested_to_email: "",
    requested_to_phone_no: "",
    testimonial_for: "",
    notes: "",
  });

  useEffect(() => {
    async function loadDiviners() {
      try {
        const res = await fetch("/api/admin/diviners");
        if (res.ok) {
          const data = await res.json();
          setDiviners(data.diviners ?? []);
        }
      } catch {
        toast.error("Failed to load diviners.");
      }
    }
    loadDiviners();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.requested_to_name.trim() || !form.requested_to_email.trim()) {
      toast.error("Customer name and email are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_to_name: form.requested_to_name.trim(),
          requested_to_email: form.requested_to_email.trim(),
          requested_to_phone_no: form.requested_to_phone_no.trim() || null,
          testimonial_for: form.testimonial_for || null,
          notes: form.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to create request.");
        return;
      }

      toast.success("Testimonial request created successfully.");
      router.push("/admin/testimonials/requests");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/testimonials/requests">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request Testimonial</h1>
          <p className="text-muted-foreground text-sm">Send a testimonial request to a customer.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Enter the customer's information and any specific notes for this request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requested_to_name">Customer Name <span className="text-destructive">*</span></Label>
                <Input
                  id="requested_to_name"
                  value={form.requested_to_name}
                  onChange={(e) => setForm({ ...form, requested_to_name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_to_email">Customer Email <span className="text-destructive">*</span></Label>
                <Input
                  id="requested_to_email"
                  type="email"
                  value={form.requested_to_email}
                  onChange={(e) => setForm({ ...form, requested_to_email: e.target.value })}
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_to_phone_no">Phone Number (Optional)</Label>
                <Input
                  id="requested_to_phone_no"
                  value={form.requested_to_phone_no}
                  onChange={(e) => setForm({ ...form, requested_to_phone_no: e.target.value })}
                  placeholder="+1 (XXX) XXX-XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimonial_for">Assign to Diviner (Optional)</Label>
                <select
                  id="testimonial_for"
                  value={form.testimonial_for}
                  onChange={(e) => setForm({ ...form, testimonial_for: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Select Diviner —</option>
                  {diviners.map((d) => (
                    <option key={d.id} value={d.id}>{d.display_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any internal notes about this request..."
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                asChild
                type="button"
                variant="ghost"
                disabled={loading}
              >
                <Link href="/admin/testimonials/requests">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 shadow-sm"
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
