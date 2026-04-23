"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

interface ConfigData {
  id: string;
  featureKey: string;
  isEnabled: boolean;
  blockTitle: string;
  blockBody: string;
  buttonLabel: string;
  bookingLink: string;
  openMode: "same_tab" | "new_tab";
  highlightVariant: "info" | "neutral" | "warning" | "success";
  helperText: string | null;
  successMessage: string | null;
  cancelledMessage: string | null;
  postBookingMessage: string | null;
  displayPriority: number;
  updatedBy: string | null;
  updatedAt: string;
  version: number;
}

export default function TabbieAppointmentConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [blockTitle, setBlockTitle] = useState("");
  const [blockBody, setBlockBody] = useState("");
  const [buttonLabel, setButtonLabel] = useState("Book Appointment");
  const [bookingLink, setBookingLink] = useState("");
  const [openMode, setOpenMode] = useState<"same_tab" | "new_tab">("same_tab");
  const [highlightVariant, setHighlightVariant] = useState<"info" | "neutral" | "warning" | "success">("info");
  const [helperText, setHelperText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelledMessage, setCancelledMessage] = useState("");
  const [postBookingMessage, setPostBookingMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tabbie-appointment-config");
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.title ?? "Failed to load config");
      const data: ConfigData | null = json.data;
      setConfig(data);
      if (data) {
        setIsEnabled(data.isEnabled);
        setBlockTitle(data.blockTitle);
        setBlockBody(data.blockBody);
        setButtonLabel(data.buttonLabel);
        setBookingLink(data.bookingLink);
        setOpenMode(data.openMode);
        setHighlightVariant(data.highlightVariant);
        setHelperText(data.helperText ?? "");
        setSuccessMessage(data.successMessage ?? "");
        setCancelledMessage(data.cancelledMessage ?? "");
        setPostBookingMessage(data.postBookingMessage ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/tabbie-appointment-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: isEnabled,
          block_title: blockTitle,
          block_body: blockBody,
          button_label: buttonLabel,
          booking_link: bookingLink,
          open_mode: openMode,
          highlight_variant: highlightVariant,
          helper_text: helperText || null,
          success_message: successMessage || null,
          cancelled_message: cancelledMessage || null,
          post_booking_message: postBookingMessage || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? json.title ?? "Save failed");
      setConfig(json.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tabbie Appointment Config</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure the post-training appointment block shown to graduated trainees.
        </p>
      </div>

      {config && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="outline">v{config.version}</Badge>
          {config.updatedBy && <span>Last updated by {config.updatedBy}</span>}
          {config.updatedAt && (
            <span>on {new Date(config.updatedAt).toLocaleString("en-US")}</span>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md border border-green-400/40 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="size-4 shrink-0" />
          Configuration saved successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Toggle</CardTitle>
          <CardDescription>Enable or disable the appointment block for all trainees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="is_enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="is_enabled">
              {isEnabled ? "Enabled — block visible to eligible trainees" : "Disabled — block hidden from all trainees"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Block Content</CardTitle>
          <CardDescription>Text shown on the appointment card when a trainee is eligible to book.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="block_title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="block_title"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder="Book Your Post-Training Appointment"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="block_body">Body <span className="text-destructive">*</span></Label>
            <Textarea
              id="block_body"
              value={blockBody}
              onChange={(e) => setBlockBody(e.target.value)}
              placeholder="Describe the appointment and why it matters…"
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="helper_text">Helper Text (optional)</Label>
            <Input
              id="helper_text"
              value={helperText}
              onChange={(e) => setHelperText(e.target.value)}
              placeholder="e.g. This appointment is required to complete your trainee journey."
              maxLength={300}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call to Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="button_label">Button Label <span className="text-destructive">*</span></Label>
            <Input
              id="button_label"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              placeholder="Book Appointment with Tabbie"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="booking_link">Booking Link <span className="text-destructive">*</span></Label>
            <Input
              id="booking_link"
              type="url"
              value={bookingLink}
              onChange={(e) => setBookingLink(e.target.value)}
              placeholder="https://calendly.com/tabbie/…"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1 space-y-1.5">
              <Label>Open Mode</Label>
              <Select value={openMode} onValueChange={(v) => setOpenMode(v as "same_tab" | "new_tab")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_tab">Same Tab</SelectItem>
                  <SelectItem value="new_tab">New Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Card Style</Label>
              <Select
                value={highlightVariant}
                onValueChange={(v) => setHighlightVariant(v as typeof highlightVariant)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (blue)</SelectItem>
                  <SelectItem value="neutral">Neutral (gray)</SelectItem>
                  <SelectItem value="warning">Warning (amber)</SelectItem>
                  <SelectItem value="success">Success (green)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">State Messages</CardTitle>
          <CardDescription>Messages shown when the appointment is in different lifecycle states.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="post_booking_message">After Booking (booked state)</Label>
            <Textarea
              id="post_booking_message"
              value={postBookingMessage}
              onChange={(e) => setPostBookingMessage(e.target.value)}
              rows={2}
              placeholder="Your appointment is scheduled. We look forward to speaking with you!"
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancelled_message">After Cancellation</Label>
            <Textarea
              id="cancelled_message"
              value={cancelledMessage}
              onChange={(e) => setCancelledMessage(e.target.value)}
              rows={2}
              placeholder="Your appointment was cancelled. Please book a new time to continue your journey."
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="success_message">After Completion</Label>
            <Textarea
              id="success_message"
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              rows={2}
              placeholder="Your appointment has been completed. Well done!"
              maxLength={500}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
