"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, Bell, UserPlus, Plus, Link2, CreditCard } from "lucide-react";

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  base_price: number;
  duration_minutes: number;
  category: string;
}

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "IST (India Standard Time)" },
  { value: "America/New_York", label: "ET (Eastern Time)" },
  { value: "America/Chicago", label: "CT (Central Time)" },
  { value: "America/Denver", label: "MT (Mountain Time)" },
  { value: "America/Los_Angeles", label: "PT (Pacific Time)" },
  { value: "America/Anchorage", label: "AKT (Alaska Time)" },
  { value: "Pacific/Honolulu", label: "HST (Hawaii Time)" },
  { value: "UTC", label: "UTC" },
];

function getExtendedTimezoneOptions() {
  const rawTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const browserTZ = (rawTZ === "Asia/Calcutta" || rawTZ === "Asia/Kolkata") ? "Asia/Kolkata" : rawTZ;
  const exists = TIMEZONE_OPTIONS.some(o => o.value === browserTZ);
  if (exists) return TIMEZONE_OPTIONS;
  return [...TIMEZONE_OPTIONS, { value: browserTZ, label: `${browserTZ.replace(/_/g, " ")} (Local)` }];
}

interface ManualBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTime?: string; // ISO string
}

export function ManualBookingModal({
  open,
  onOpenChange,
  initialTime,
}: ManualBookingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isManualClient, setIsManualClient] = useState(false);
  const [isReminderOnly, setIsReminderOnly] = useState(false);

  // Manual client info
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  // Service + payment
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [sendPaymentLink, setSendPaymentLink] = useState(false);

  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [scheduledEndTime, setScheduledEndTime] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  const selectedService = services.find(s => s.id === selectedServiceId) ?? null;
  const serviceHasPrice = (selectedService?.base_price ?? 0) > 0;

  // Fetch services on open
  useEffect(() => {
    if (!open) return;
    fetch("/api/dashboard/services?active=true&limit=50")
      .then(r => r.json())
      .then(d => setServices(d.services ?? []))
      .catch(() => {});
  }, [open]);

  // Search clients with debounce
  useEffect(() => {
    if (!open || isManualClient || isReminderOnly) return;

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchClients(searchQuery);
      } else {
        setClients([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, open, isManualClient, isReminderOnly]);

  // Reset payment link toggle when service changes
  useEffect(() => {
    if (!serviceHasPrice) setSendPaymentLink(false);
  }, [selectedServiceId, serviceHasPrice]);

  // Initialization/Cleanup
  useEffect(() => {
    if (open) {
      const rawTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const browserTZ = (rawTZ === "Asia/Calcutta" || rawTZ === "Asia/Kolkata") ? "Asia/Kolkata" : rawTZ;
      setTimezone(browserTZ);

      if (initialTime) {
        const date = new Date(initialTime);
        setScheduledDate(date.toISOString().split("T")[0]);
        setScheduledTime(date.toTimeString().slice(0, 5));
        const endDate = new Date(date.getTime() + 30 * 60000);
        setScheduledEndTime(endDate.toTimeString().slice(0, 5));
      } else {
        const now = new Date();
        setScheduledDate(now.toISOString().split("T")[0]);
        setScheduledTime(now.toTimeString().slice(0, 5));
        const endDate = new Date(now.getTime() + 30 * 60000);
        setScheduledEndTime(endDate.toTimeString().slice(0, 5));
      }
    } else {
      setSelectedClientId("");
      setIsManualClient(false);
      setIsReminderOnly(false);
      setManualName("");
      setManualEmail("");
      setSearchQuery("");
      setNotes("");
      setSendEmail(false);
      setSelectedServiceId("");
      setSendPaymentLink(false);
      setClients([]);
    }
  }, [open, initialTime]);

  async function fetchClients(q: string) {
    setSearching(true);
    try {
      const res = await fetch(`/api/dashboard/clients/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  }

  async function handleCreateBooking() {
    if (!isReminderOnly && !selectedClientId && (!manualName || !manualEmail)) {
      toast.error("Please select a client or enter client details");
      return;
    }
    if (!scheduledDate || !scheduledTime || !scheduledEndTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: isReminderOnly ? null : selectedClientId,
          manual_client: isManualClient ? { name: manualName, email: manualEmail } : null,
          is_reminder: isReminderOnly,
          service_id: selectedServiceId || null,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          scheduled_end_time: scheduledEndTime,
          timezone,
          notes,
          send_email: sendEmail,
          send_payment_link: sendPaymentLink,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      const data = await res.json();

      if (data.payment_url) {
        toast.success("Booking created — payment link sent to client", {
          description: "The client will receive an email with the payment link.",
          duration: 6000,
        });
      } else {
        toast.success(isReminderOnly ? "Reminder saved" : "Booking created successfully");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const tzOptions = getExtendedTimezoneOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isReminderOnly ? "Add Personal Reminder" : "Create Manual Booking"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Booking Type */}
          <div className="flex flex-wrap gap-4 items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2">
              <Switch
                id="reminder-mode"
                checked={isReminderOnly}
                onCheckedChange={(val) => {
                  setIsReminderOnly(val);
                  if (val) setIsManualClient(false);
                }}
              />
              <Label htmlFor="reminder-mode" className="text-sm font-medium">Personal Reminder / Only for Me</Label>
            </div>

            {!isReminderOnly && (
              <div className="flex items-center gap-2">
                <Switch
                  id="manual-mode"
                  checked={isManualClient}
                  onCheckedChange={(val) => {
                    setIsManualClient(val);
                    if (val) setSelectedClientId("");
                  }}
                />
                <Label htmlFor="manual-mode" className="text-sm font-medium">Add New Client Manually</Label>
              </div>
            )}
          </div>

          {/* Client selection */}
          {!isReminderOnly && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              {isManualClient ? (
                <div className="grid grid-cols-2 gap-4 border-l-2 border-amber-500 pl-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="client-name">Client Full Name</Label>
                    <Input
                      id="client-name"
                      placeholder="e.g. John Doe"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-email">Client Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Search Existing Client</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name or email..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {(searchQuery || clients.length > 0) && (
                    <div className="mt-2 max-h-[140px] overflow-y-auto rounded-md border border-input bg-background shadow-sm">
                      {searching ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : clients.length > 0 ? (
                        clients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${
                              selectedClientId === client.id ? "bg-accent border-l-2 border-amber-500" : ""
                            }`}
                            onClick={() => setSelectedClientId(client.id)}
                          >
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 opacity-70" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold">{client.full_name}</span>
                              <span className="text-xs text-muted-foreground">{client.email}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <span>No clients found matching "{searchQuery}"</span>
                            <Button variant="link" size="sm" onClick={() => setIsManualClient(true)} className="h-auto p-0">
                              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                              Add as new client?
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Service selector */}
          {!isReminderOnly && (
            <div className="space-y-1.5">
              <Label>Service <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select
                value={selectedServiceId || "__none"}
                onValueChange={(v) => setSelectedServiceId(v === "__none" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No service</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        {s.name}
                        {s.base_price > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-500/40">
                            ${s.base_price}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                  {services.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No services assigned</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment link toggle — only shown when service has a price */}
          {!isReminderOnly && serviceHasPrice && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in duration-200">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <CreditCard className="h-4 w-4 text-emerald-500" />
                  Send Payment Link
                </div>
                <p className="text-xs text-muted-foreground">
                  Client will receive a Stripe payment link for{" "}
                  <strong className="text-foreground">${selectedService!.base_price}</strong>.
                  Booking confirms automatically after payment.
                </p>
              </div>
              <Switch checked={sendPaymentLink} onCheckedChange={setSendPaymentLink} />
            </div>
          )}

          {/* Date / Time / Timezone */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tzOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 ">
              <div className="space-y-2">
                <Label htmlFor="date">Session Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={scheduledEndTime}
                  onChange={(e) => setScheduledEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes & Instructions (Internal)</Label>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Private details, birth data, or specific questions for this session..."
            />
          </div>

          {/* Notification toggle (plain email, no payment) */}
          {!isReminderOnly && !sendPaymentLink && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Client Notification
                </div>
                <p className="text-xs text-muted-foreground">Send a confirmation email to the client now</p>
              </div>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>
          )}

          {/* Payment link info banner */}
          {sendPaymentLink && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400 animate-in fade-in duration-200">
              <Link2 className="mt-0.5 size-4 shrink-0" />
              <span>
                A Stripe-hosted payment page will be emailed to the client.
                The booking status will remain <strong>Pending Payment</strong> until they pay.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateBooking}
            className={
              sendPaymentLink
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                : "bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            }
            disabled={
              loading ||
              (!isReminderOnly && !selectedClientId && !isManualClient) ||
              !scheduledDate ||
              !scheduledTime ||
              !scheduledEndTime
            }
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : sendPaymentLink ? (
              <CreditCard className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isReminderOnly
              ? "Save Reminder"
              : sendPaymentLink
              ? "Create & Send Payment Link"
              : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
