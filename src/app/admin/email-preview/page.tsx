"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { value: "community_welcome", label: "Community Welcome" },
  { value: "monthly_transit_ready", label: "Monthly Transit Ready" },
  { value: "community_renewal_reminder", label: "Renewal Reminder" },
  { value: "community_payment_failed", label: "Payment Failed" },
  { value: "membership_expiry_warning", label: "Expiry Warning" },
  { value: "mystery_school_enrollment", label: "Mystery School Enrollment" },
  { value: "sunday_service_new_episode", label: "Sunday Service New Episode" },
] as const;

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminEmailPreviewPage() {
  const [selected, setSelected] = useState<string>(TEMPLATES[0].value);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendResult, setSendResult] = useState<string>("");

  async function loadPreview() {
    setLoading(true);
    setSendResult("");
    const res = await fetch(`/api/admin/email-preview?template=${encodeURIComponent(selected)}`);
    if (res.ok) {
      const json = await res.json();
      setPreviewHtml(json.html ?? "");
    } else {
      setPreviewHtml("<p>Failed to load preview.</p>");
    }
    setLoading(false);
  }

  async function sendTest() {
    setSendLoading(true);
    setSendResult("");
    const res = await fetch("/api/admin/email-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: selected,
        sendTestTo: testEmail.trim() || undefined,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setSendResult(`Test email sent to ${json.to}`);
    } else {
      const json = await res.json();
      setSendResult(`Error: ${json.error ?? "Failed to send"}`);
    }
    setSendLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Email Preview</h1>
        <p className="text-muted-foreground">
          Preview community email templates with representative dummy data.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Template selector */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Template
              </label>
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setPreviewHtml("");
                  setSendResult("");
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview button */}
            <Button
              onClick={loadPreview}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Eye className="mr-1.5 size-4" />
              )}
              Preview
            </Button>
          </div>

          {/* Send test */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Send test to (leave blank to send to your account)
              </label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={sendTest}
              disabled={sendLoading || !selected}
              size="sm"
            >
              {sendLoading ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 size-4" />
              )}
              Send Test
            </Button>
          </div>

          {sendResult && (
            <p
              className={`text-sm ${
                sendResult.startsWith("Error")
                  ? "text-destructive"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {sendResult}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview iframe */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : previewHtml ? (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground bg-muted/30">
              <span>
                Preview:{" "}
                {TEMPLATES.find((t) => t.value === selected)?.label ?? selected}
              </span>
              <span className="text-[10px] font-mono">{selected}</span>
            </div>
            {/* Render in a sandboxed div — email HTML is internal, fully controlled */}
            <div
              className="overflow-auto"
              style={{ maxHeight: "75vh" }}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: email preview HTML is generated internally by buildEmailHtml, not from user input
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
