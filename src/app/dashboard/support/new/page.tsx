"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

// ─── Category / Subcategory map ───────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { label: string; subcategories: { value: string; label: string }[] }> = {
  Account: {
    label: "Account & Login",
    subcategories: [
      { value: "Login Issue", label: "Cannot log in" },
      { value: "OTP Issue", label: "Did not receive OTP / verification email" },
      { value: "Profile Update", label: "Account / profile correction request" },
      { value: "Password Reset", label: "Password reset" },
    ],
  },
  Payment: {
    label: "Payment & Billing",
    subcategories: [
      { value: "Payment Failure", label: "Payment failed" },
      { value: "Duplicate Charge", label: "Duplicate or extra charge" },
      { value: "Invoice", label: "Invoice / receipt needed" },
      { value: "Subscription", label: "Subscription issue" },
    ],
  },
  Refund: {
    label: "Refund / Cancellation",
    subcategories: [
      { value: "Refund Request", label: "Request a refund" },
      { value: "Cancellation", label: "Cancel a booking or order" },
      { value: "Exchange", label: "Exchange / swap" },
    ],
  },
  Booking: {
    label: "Booking & Appointment",
    subcategories: [
      { value: "Cannot Book", label: "Cannot complete booking" },
      { value: "Reschedule", label: "Reschedule request" },
      { value: "Session Issue", label: "Session or stream issue" },
      { value: "No Show", label: "No-show / missed session" },
    ],
  },
  Course: {
    label: "Course Access",
    subcategories: [
      { value: "Access Issue", label: "Cannot access purchased course" },
      { value: "Lesson Issue", label: "Lesson not loading" },
      { value: "Progress Issue", label: "Progress not saved" },
    ],
  },
  Order: {
    label: "Orders & Fulfillment",
    subcategories: [
      { value: "Order Missing", label: "Order not received" },
      { value: "Tracking", label: "Tracking not updated" },
      { value: "Wrong Item", label: "Wrong or damaged item" },
    ],
  },
  Technical: {
    label: "Technical Issue",
    subcategories: [
      { value: "Stream Issue", label: "Live stream / video issue" },
      { value: "Chat Issue", label: "Chat / messaging issue" },
      { value: "App Bug", label: "App bug or error" },
      { value: "Other Technical", label: "Other technical issue" },
    ],
  },
  Complaint: {
    label: "Complaint / Feedback",
    subcategories: [
      { value: "Service Complaint", label: "Complaint about a service" },
      { value: "Diviner Complaint", label: "Complaint about a diviner" },
      { value: "General Feedback", label: "General feedback" },
    ],
  },
  Abuse: {
    label: "Abuse / Safety Report",
    subcategories: [
      { value: "Abusive Behavior", label: "Abusive or inappropriate behavior" },
      { value: "Fraud", label: "Suspected fraud" },
      { value: "Other Safety", label: "Other safety concern" },
    ],
  },
  Other: {
    label: "Other",
    subcategories: [
      { value: "Other", label: "Other / not listed above" },
    ],
  },
};

// Related entity types that can be attached
const ENTITY_TYPES = [
  { value: "", label: "None" },
  { value: "order", label: "Order" },
  { value: "booking", label: "Booking" },
  { value: "session", label: "Session / Live stream" },
  { value: "course", label: "Course" },
  { value: "payout", label: "Payout" },
];

// Priority options exposed to the user (maps to DB values)
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low — general question, no urgency" },
  { value: "normal", label: "Normal — issue affecting my work" },
  { value: "high", label: "High — significant impact on my service" },
  { value: "urgent", label: "Urgent — blocking me from working" },
] as const;

type CategoryKey = keyof typeof CATEGORY_MAP;
type PriorityValue = (typeof PRIORITY_OPTIONS)[number]["value"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTicketPage() {
  const router = useRouter();

  const [category, setCategory] = useState<CategoryKey | "">("");
  const [subcategory, setSubcategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityValue>("normal");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleCategoryChange(val: string) {
    setCategory(val as CategoryKey);
    setSubcategory(""); // reset subcategory when category changes
  }

  const subcategoryOptions = category ? (CATEGORY_MAP[category]?.subcategories ?? []) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!category) {
      toast.error("Please select a category.");
      return;
    }
    if (subject.trim().length < 5) {
      toast.error("Subject must be at least 5 characters.");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Please describe your issue in more detail.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "support",
          category,
          subcategory: subcategory || undefined,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          related_entity_type: entityType || undefined,
          related_entity_id: entityId.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create ticket.");
      }

      const ticket = await res.json();
      toast.success(`Ticket ${ticket.ticket_number} created.`);
      router.push(`/dashboard/support/${ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Support
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Support Request</CardTitle>
          <CardDescription>
            Describe your issue and we will get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory — only shown when category is selected and has options */}
            {subcategoryOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={subcategory}
                  onValueChange={setSubcategory}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select a subcategory (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoryOptions.map((sc) => (
                      <SelectItem key={sc.value} value={sc.value}>
                        {sc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                required
              />
              <p className="text-xs text-muted-foreground">
                {subject.length}/150 characters
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as PriorityValue)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Explain the issue in detail. Include any relevant order numbers, dates, or steps to reproduce."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            {/* Related entity selector */}
            <div className="space-y-3 rounded-md border p-4 bg-muted/30">
              <p className="text-sm font-medium">Related record (optional)</p>
              <p className="text-xs text-muted-foreground -mt-1">
                Link this ticket to an existing order, booking, or session to help us resolve it faster.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="entity-type" className="text-xs">Record type</Label>
                  <Select value={entityType} onValueChange={(v) => { setEntityType(v); setEntityId(""); }}>
                    <SelectTrigger id="entity-type">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((et) => (
                        <SelectItem key={et.value} value={et.value}>
                          {et.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {entityType && (
                  <div className="space-y-1.5">
                    <Label htmlFor="entity-id" className="text-xs">
                      {entityType.charAt(0).toUpperCase() + entityType.slice(1)} ID / reference
                    </Label>
                    <Input
                      id="entity-id"
                      placeholder={`e.g. ORD-12345`}
                      value={entityId}
                      onChange={(e) => setEntityId(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Submit Ticket
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/dashboard/support">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
