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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.requested_to_name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (!form.requested_to_email.trim()) {
      toast.error("Customer email is required.");
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

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create request.");
        return;
      }

      toast.success("Testimonial request created.");
      router.push("/admin/testimonials/requests");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/testimonials/requests">← Back</Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Request Testimonial</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Testimonial</CardTitle>
          <CardDescription>
            Send a testimonial request to a customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="requested_to_name">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="requested_to_name"
                name="requested_to_name"
                type="text"
                value={form.requested_to_name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Jane Doe"
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                htmlFor="requested_to_email"
              >
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                id="requested_to_email"
                name="requested_to_email"
                type="email"
                value={form.requested_to_email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="jane@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                htmlFor="requested_to_phone_no"
              >
                Phone
              </label>
              <input
                id="requested_to_phone_no"
                name="requested_to_phone_no"
                type="tel"
                value={form.requested_to_phone_no}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="+1 (XXX) XXX-XXXX"
              />
            </div>

            {/* Select Astrologer */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="testimonial_for">
                Select Astrologer
              </label>
              <select
                id="testimonial_for"
                name="testimonial_for"
                value={form.testimonial_for}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— Select Astrologer (optional) —</option>
                {diviners.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Any notes about this request…"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Create Request"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/testimonials/requests">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
