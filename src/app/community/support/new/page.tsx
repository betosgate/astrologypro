"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";

const CATEGORY_MAP: Record<string, { label: string; subcategories: { value: string; label: string }[] }> = {
  Account: {
    label: "Account & Login",
    subcategories: [
      { value: "Login Issue", label: "Cannot log in" },
      { value: "Profile Update", label: "Account or profile correction" },
      { value: "Password Reset", label: "Password reset" },
    ],
  },
  Billing: {
    label: "Billing & Plan",
    subcategories: [
      { value: "Subscription", label: "Subscription issue" },
      { value: "Invoice", label: "Invoice or receipt" },
      { value: "Payment Failure", label: "Payment failed" },
    ],
  },
  Family: {
    label: "Family / Household",
    subcategories: [
      { value: "Family Member", label: "Family member record" },
      { value: "Household Access", label: "Household access" },
    ],
  },
  NatalChart: {
    label: "Natal Chart",
    subcategories: [
      { value: "Chart Generation", label: "Chart generation" },
      { value: "Birth Data Correction", label: "Birth data correction" },
    ],
  },
  MonthlyTransits: {
    label: "Monthly Transits",
    subcategories: [
      { value: "Transit Generation", label: "Transit generation" },
      { value: "Transit Interpretation", label: "Transit interpretation" },
    ],
  },
  RelationshipChart: {
    label: "Relationship Chart",
    subcategories: [
      { value: "Relationship Generation", label: "Chart generation" },
      { value: "Relationship Interpretation", label: "Interpretation issue" },
    ],
  },
  Rituals: {
    label: "Rituals",
    subcategories: [
      { value: "Ritual Builder", label: "Ritual builder" },
      { value: "Ritual Playback", label: "Ritual playback" },
    ],
  },
  Tarot: {
    label: "Tarot",
    subcategories: [
      { value: "Reading Issue", label: "Reading issue" },
      { value: "Reading History", label: "Reading history" },
    ],
  },
  Events: {
    label: "Events / Broadcasts / Sunday Service",
    subcategories: [
      { value: "Event Access", label: "Event access" },
      { value: "Broadcast Issue", label: "Broadcast issue" },
      { value: "Sunday Service", label: "Sunday service" },
    ],
  },
  Technical: {
    label: "Technical Issue",
    subcategories: [
      { value: "App Bug", label: "App bug or error" },
      { value: "Video Issue", label: "Video or stream issue" },
      { value: "Other Technical", label: "Other technical issue" },
    ],
  },
  Abuse: {
    label: "Abuse / Safety",
    subcategories: [
      { value: "Abuse Report", label: "Abuse report" },
      { value: "Safety Concern", label: "Safety concern" },
    ],
  },
  Other: {
    label: "Other",
    subcategories: [{ value: "Other", label: "Other / not listed above" }],
  },
};

const ENTITY_TYPES = [
  { value: "none", label: "None" },
  { value: "natal_chart", label: "Natal chart" },
  { value: "monthly_transit", label: "Monthly transit" },
  { value: "relationship_chart", label: "Relationship chart" },
  { value: "session", label: "Session / event" },
  { value: "course", label: "Course / resource" },
  { value: "order", label: "Order" },
  { value: "booking", label: "Booking" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low - general question" },
  { value: "normal", label: "Normal - issue needs attention" },
  { value: "high", label: "High - significant impact" },
  { value: "urgent", label: "Urgent - blocking access" },
] as const;

type CategoryKey = keyof typeof CATEGORY_MAP;
type PriorityValue = (typeof PRIORITY_OPTIONS)[number]["value"];

export default function NewCommunityTicketPage() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [subcategory, setSubcategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityValue>("normal");
  const [entityType, setEntityType] = useState("none");
  const [entityId, setEntityId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subcategoryOptions = category ? CATEGORY_MAP[category]?.subcategories ?? [] : [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
          source_portal: "community",
          category,
          subcategory: subcategory || undefined,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          related_entity_type: entityType === "none" ? undefined : entityType,
          related_entity_id: entityId.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to create ticket.");
      }

      const ticket = await res.json();
      toast.success(`Ticket ${ticket.ticket_number} created.`);
      router.push(`/community/support/${ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/community/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Support
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Support Request</CardTitle>
          <CardDescription>Send a support request to the Community team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value as CategoryKey);
                  setSubcategory("");
                }}
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

            {subcategoryOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select a subcategory (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={150}
                required
              />
              <p className="text-xs text-muted-foreground">{subject.length}/150 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as PriorityValue)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Explain the issue in detail. Include relevant dates, pages, or reference IDs."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-3 rounded-md border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium">Related record (optional)</p>
                <p className="mt-1 text-xs text-muted-foreground">Attach a chart, transit, session, or other record reference.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="entity-type" className="text-xs">
                    Record type
                  </Label>
                  <Select
                    value={entityType}
                    onValueChange={(value) => {
                      setEntityType(value);
                      setEntityId("");
                    }}
                  >
                    <SelectTrigger id="entity-type">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {entityType !== "none" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="entity-id" className="text-xs">
                      Reference ID
                    </Label>
                    <Input
                      id="entity-id"
                      placeholder="Paste the record ID or reference"
                      value={entityId}
                      onChange={(event) => setEntityId(event.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit Ticket
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/community/support">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
