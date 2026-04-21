"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  User,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Users,
  Sparkles,
} from "lucide-react";

interface Assignment {
  id: string;
  diviner_id: string;
  diviner_username: string | null;
  diviner_display_name: string | null;
  diviner_avatar_url: string | null;
  destination_type: "PROFILE" | "SERVICE";
  destination_name: string;
  commission_type: "percent" | "flat";
  commission_value: number;
  is_active: boolean;
  assigned_at: string;
  campaigns_count: number;
  campaigns: Array<{ id: string; status: string; campaign_code: string | null }>;
  kpis_30d: {
    clicks: number;
    unique_clicks: number;
    conversions: number;
    commission_cents: number;
  };
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtCommission(type: "percent" | "flat", value: number) {
  return type === "percent" ? `${value}%` : `$${value.toFixed(2)}`;
}

export default function AdvocateAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFor, setCreateFor] = useState<Assignment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advocate/assignments");
      if (res.ok) {
        const json = await res.json();
        setAssignments((json.assignments ?? []) as Assignment[]);
      } else if (res.status === 403) {
        toast.error("You don't have an affiliate account");
      } else {
        toast.error("Failed to load assignments");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = assignments.filter((a) => a.is_active);
  const inactive = assignments.filter((a) => !a.is_active);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">My Assignments</h1>
          <p className="text-xs text-muted-foreground">
            Diviners who have assigned you to promote their profile or a specific service.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Sparkles className="size-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-medium">No assignments yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Once a diviner assigns you to promote their profile or a specific
              service, it will appear here and you'll be able to create
              campaigns against it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {active.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onCreateCampaign={() => setCreateFor(a)}
                  />
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revoked</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {inactive.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} onCreateCampaign={() => {}} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {createFor && (
        <CreateCampaignDialog
          assignment={createFor}
          onClose={() => setCreateFor(null)}
          onCreated={() => {
            setCreateFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onCreateCampaign,
}: {
  assignment: Assignment;
  onCreateCampaign: () => void;
}) {
  return (
    <Card className={!assignment.is_active ? "opacity-70" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {assignment.diviner_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assignment.diviner_avatar_url}
                alt=""
                className="size-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">
                {assignment.diviner_display_name ?? assignment.diviner_username ?? "Diviner"}
              </CardTitle>
              <CardDescription className="text-xs flex items-center gap-1">
                {assignment.destination_type === "PROFILE" ? (
                  <User className="size-3" />
                ) : (
                  <BookOpen className="size-3" />
                )}
                {assignment.destination_name}
              </CardDescription>
            </div>
          </div>
          <Badge variant={assignment.is_active ? "default" : "secondary"}>
            {fmtCommission(assignment.commission_type, assignment.commission_value)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Clicks (30d)" value={assignment.kpis_30d.clicks} />
          <Stat label="Conversions" value={assignment.kpis_30d.conversions} />
          <Stat label="Earned" value={fmtCents(assignment.kpis_30d.commission_cents)} />
        </div>

        {assignment.is_active && (
          <Button size="sm" className="w-full" onClick={onCreateCampaign}>
            <Plus className="mr-1.5 size-3.5" />
            Create Campaign
          </Button>
        )}

        {assignment.campaigns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Your campaigns ({assignment.campaigns.length})
            </p>
            {assignment.campaigns.slice(0, 3).map((c) => (
              <ShareLinkRow key={c.id} code={c.campaign_code} status={c.status} />
            ))}
            {assignment.campaigns.length > 3 && (
              <Link
                href="/advocate/campaigns"
                className="text-xs text-primary hover:underline"
              >
                View all {assignment.campaigns.length} campaigns →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function ShareLinkRow({ code, status }: { code: string | null; status: string }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://astrologypro.com";
  const url = `${appUrl}/r/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <Badge variant="outline" className="text-[10px] h-5">{status}</Badge>
      <code className="flex-1 truncate font-mono text-muted-foreground">{code}</code>
      <Button variant="ghost" size="sm" onClick={copy} className="h-6 px-1.5">
        {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
      </Button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground hover:text-foreground">
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function CreateCampaignDialog({
  assignment,
  onClose,
  onCreated,
}: {
  assignment: Assignment;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ share_url: string; campaign_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/advocate/assignments/${assignment.id}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          channel: channel || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        toast.success("Campaign created");
        setResult({
          share_url: json.campaign.share_url,
          campaign_code: json.campaign.campaign_code,
        });
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Failed to create campaign");
      }
    } finally {
      setSaving(false);
    }
  }

  async function copyShare() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function handleDone() {
    setResult(null);
    onCreated();
  }

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {result ? "Campaign Created" : "Create Campaign"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? "Share this URL to drive tagged traffic to your assignment."
              : `Promoting ${assignment.diviner_display_name ?? assignment.diviner_username ?? "this diviner"}${assignment.destination_type === "SERVICE" ? ` — ${assignment.destination_name}` : ""}.`}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-emerald-500/5 p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">Share URL</p>
              <div className="flex items-center gap-1.5 rounded border bg-background p-2">
                <code className="flex-1 truncate font-mono text-xs">{result.share_url}</code>
                <Button variant="ghost" size="sm" onClick={copyShare} className="h-6 px-2">
                  {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  <span className="ml-1 text-[11px]">{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Code: <code className="font-mono">{result.campaign_code}</code>
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium">
                  {assignment.destination_type === "PROFILE" ? "Profile" : assignment.destination_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Commission</span>
                <span className="font-medium">
                  {fmtCommission(assignment.commission_type, assignment.commission_value)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Destination and commission are inherited from your assignment and cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Campaign name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IG October launch" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional notes to yourself about this campaign."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channel</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="">— pick one —</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="podcast">Podcast</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>End date (optional)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={saving || !name.trim()}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create Campaign
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
