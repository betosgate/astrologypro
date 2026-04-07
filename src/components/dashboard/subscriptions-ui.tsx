"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Send, CalendarClock, PlusCircle, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/format";

// ---- Types ----

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribed_at: string;
  cancelled_at: string | null;
};

type Delivery = {
  id: string;
  subject: string;
  scheduled_for: string;
  sent_at: string | null;
  recipient_count: number;
  status: string;
};

type Product = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
};

// ---- Status badge helper ----

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    past_due: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  const cls = variants[status] ?? variants.draft;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}

// ---- Product setup / edit card ----

export function ProductSetupCard({
  product,
  onSaved,
}: {
  product: Product | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(!product);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(product?.title ?? "Weekly Personalized Updates");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceDollars, setPriceDollars] = useState(
    product ? (product.price_cents / 100).toFixed(2) : "10.00"
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    const priceNum = parseFloat(priceDollars);
    if (isNaN(priceNum) || priceNum < 0) errs.price = "Enter a valid price.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await fetch("/api/dashboard/weekly-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        price_cents: Math.round(parseFloat(priceDollars) * 100),
        is_active: isActive,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.detail ?? "Failed to save product.");
      return;
    }
    toast.success(product ? "Subscription updated." : "Subscription created.");
    setOpen(false);
    onSaved();
  }

  if (!open) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">{product?.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(product?.price_cents ?? 0)} / month ·{" "}
              {product?.is_active ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-muted-foreground">Inactive</span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {product ? "Edit Subscription" : "Set Up Your Subscription"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-title">Title *</Label>
            <Input
              id="sub-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Personalized Updates"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-desc">Description</Label>
            <Textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-price">Monthly Price (USD) *</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="sub-price"
                type="number"
                min="0"
                step="0.01"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className="max-w-[120px]"
              />
            </div>
            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sub-active">Active</Label>
              <p className="text-xs text-muted-foreground">Allow new subscriptions.</p>
            </div>
            <Switch id="sub-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {product && (
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Save Changes" : "Launch Subscription"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---- Subscribers tab ----

export function SubscribersTab({ subscribers }: { subscribers: Subscriber[] }) {
  if (subscribers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No subscribers yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name / Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Cancelled</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscribers.map((sub) => (
          <TableRow key={sub.id}>
            <TableCell>
              <div>
                {sub.name && <p className="font-medium text-sm">{sub.name}</p>}
                <p className="text-xs text-muted-foreground">{sub.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={sub.status} />
            </TableCell>
            <TableCell className="text-sm">
              {new Date(sub.subscribed_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {sub.cancelled_at ? new Date(sub.cancelled_at).toLocaleDateString() : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---- Deliveries tab ----

export function DeliveriesTab({ deliveries }: { deliveries: Delivery[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = "Subject is required.";
    if (!content.trim()) errs.content = "Content is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await fetch("/api/dashboard/weekly-subscription/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: subject.trim(),
        content: content.trim(),
        scheduled_at: scheduledAt || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.detail ?? "Failed to send delivery.");
      return;
    }
    toast.success(scheduledAt ? "Delivery scheduled." : "Delivery sent.");
    setShowForm(false);
    setSubject("");
    setContent("");
    setScheduledAt("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <PlusCircle className="mr-2 size-4" />
              New Delivery
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="del-subject">Subject *</Label>
                <Input
                  id="del-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your weekly update"
                />
                {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="del-content">Content *</Label>
                <Textarea
                  id="del-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Write your weekly message here..."
                />
                {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="del-scheduled">Schedule (optional)</Label>
                <Input
                  id="del-scheduled"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to send immediately.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : scheduledAt ? (
                    <>
                      <CalendarClock className="mr-2 size-4" />
                      Schedule
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Send Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {deliveries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No deliveries yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent / Scheduled</TableHead>
              <TableHead>Recipients</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-sm">{d.subject}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {d.sent_at
                    ? new Date(d.sent_at).toLocaleDateString()
                    : new Date(d.scheduled_for).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm">
                  {d.status === "sent" ? d.recipient_count : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ---- Main subscriptions hub (client island) ----

export function SubscriptionsHub({
  product,
  subscribers,
  deliveries,
  activeSubscribers,
  deliveriesSent,
  lastDeliveryAt,
}: {
  product: Product | null;
  subscribers: Subscriber[];
  deliveries: Delivery[];
  activeSubscribers: number;
  deliveriesSent: number;
  lastDeliveryAt: string | null;
}) {
  const router = useRouter();

  if (!product) {
    return (
      <div className="py-16 flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Send className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Launch your weekly subscription</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Build a loyal following by sending weekly updates, forecasts, and personalized content to subscribers.
          </p>
        </div>
        <ProductSetupCard product={null} onSaved={() => router.refresh()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product card */}
      <ProductSetupCard product={product} onSaved={() => router.refresh()} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{activeSubscribers}</span>
            <span className="text-xs text-muted-foreground">Active Subscribers</span>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold">{deliveriesSent}</span>
            <span className="text-xs text-muted-foreground">Deliveries Sent</span>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex flex-col items-center gap-1 px-4">
            <span className="text-2xl font-bold text-sm">
              {lastDeliveryAt
                ? new Date(lastDeliveryAt).toLocaleDateString()
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground">Last Delivery</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">
            Subscribers ({subscribers.length})
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            Deliveries ({deliveries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <SubscribersTab subscribers={subscribers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <DeliveriesTab deliveries={deliveries} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
