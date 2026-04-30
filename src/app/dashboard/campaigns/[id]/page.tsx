"use client";

import { useEffect, useState, useCallback, use } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowLeft,
  Pencil,
  Target,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";
import { CampaignUrlDisplay } from "@/components/dashboard/campaign-url-display";
import { CampaignAutoPauseBanner } from "@/components/dashboard/campaign-auto-pause-banner";
import { CampaignDestinationBadge } from "@/components/dashboard/campaign-destination-badge";

interface Conversion {
  id: string;
  affiliate_id: string;
  affiliate_type: string;
  order_reference: string | null;
  order_amount_cents: number;
  commission_amount_cents: number;
  converted_at: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  commission_type: string;
  commission_value: number;
  budget_cap_cents: number | null;
  spent_cents: number;
  target_product_type: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  conversions: Conversion[];
  // Destination fields
  destination_type: "PROFILE" | "SERVICE" | null;
  destination_service_template_id: string | null;
  campaign_code: string | null;
  share_url: string | null;
  auto_paused: boolean;
  auto_pause_reason: string | null;
  can_reactivate: boolean;
  channel: string | null;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "default",
  expired: "destructive",
};

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const loadCampaign = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/campaigns/${id}`);
    if (res.ok) {
      const json = await res.json();
      setCampaign(json.data ?? null);
    } else {
      toast.error("Failed to load campaign");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  function openEdit() {
    if (!campaign) return;
    setEditName(campaign.name);
    setEditDesc(campaign.description || "");
    setEditStatus(campaign.status);
    setEditStartDate(campaign.start_date);
    setEditEndDate(campaign.end_date || "");
    setEditOpen(true);
  }

  async function handleEdit() {
    setSaving(true);
    const res = await fetch(`/api/dashboard/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDesc,
        status: editStatus,
        start_date: editStartDate,
        end_date: editEndDate || undefined,
      }),
    });
    if (res.ok) {
      toast.success("Campaign updated");
      setEditOpen(false);
      await loadCampaign();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to update campaign");
    }
    setSaving(false);
  }

  // Affiliate enrollment removed from campaign detail — see /dashboard/affiliates/assignments
  // Delete flow removed in v2 cleanup: API endpoint requires
  // status='draft' which the trimmed enum no longer allows. Use
  // archive instead (PATCH status='archived').

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/dashboard/campaigns"><ArrowLeft className="mr-2 size-4" />Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/campaigns"><ArrowLeft className="size-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge variant={STATUS_BADGE[campaign.status] ?? "outline"}>{campaign.status}</Badge>
            </div>
            {campaign.description && (
              <p className="mt-1 text-muted-foreground">{campaign.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/campaigns/${id}/analytics`}>
              <BarChart3 className="mr-2 size-3.5" />Analytics
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="mr-2 size-3.5" />Edit
          </Button>
        </div>
      </div>

      {/* Auto-pause banner */}
      {campaign.auto_paused && (
        <CampaignAutoPauseBanner
          campaignId={campaign.id}
          reason={campaign.auto_pause_reason}
          canReactivate={campaign.can_reactivate}
          onReactivated={loadCampaign}
        />
      )}

      {/* Destination + Campaign URL */}
      {(campaign.destination_type || campaign.share_url) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Destination & Campaign Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">Destination</span>
              <CampaignDestinationBadge destinationType={campaign.destination_type} />
            </div>
            {campaign.channel && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Channel</span>
                <span className="text-sm capitalize">{campaign.channel}</span>
              </div>
            )}
            {campaign.share_url && (
              <CampaignUrlDisplay
                url={campaign.share_url}
                code={campaign.campaign_code ?? undefined}
                label={
                  campaign.status === "active" ? "Campaign URL" : "Campaign URL (inactive)"
                }
                showOpenButton
                isInactive={campaign.status !== "active"}
                inactiveReason={campaign.status ?? "Draft"}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaign Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">{fmtDate(campaign.start_date)}</p>
            <p className="text-xs text-muted-foreground">
              {campaign.end_date ? `to ${fmtDate(campaign.end_date)}` : "No end date"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.conversions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* UTM Info */}
      {(campaign.utm_source || campaign.utm_medium || campaign.utm_campaign) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">UTM Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {campaign.utm_source && <div><span className="text-muted-foreground">Source:</span> {campaign.utm_source}</div>}
              {campaign.utm_medium && <div><span className="text-muted-foreground">Medium:</span> {campaign.utm_medium}</div>}
              {campaign.utm_campaign && <div><span className="text-muted-foreground">Campaign:</span> {campaign.utm_campaign}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affiliate enrollment moved — see /dashboard/affiliates/assignments.
          Sprint 2026-04-21: affiliates are no longer enrolled per-campaign;
          they're assigned to a diviner's profile or a specific service, with
          a pre-defined commission. This page now shows only campaign-level
          data. */}
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Affiliate management moved</p>
              <p className="text-xs text-muted-foreground">
                Assign affiliates to your profile or a service (not per-campaign) from the Assignments page.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/affiliates/assignments">Open Assignments</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Conversion History */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion History</CardTitle>
          <CardDescription>{campaign.conversions.length} conversion{campaign.conversions.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.conversions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No conversions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Order Amount</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.conversions.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>{fmtDate(conv.converted_at)}</TableCell>
                      <TableCell>{conv.affiliate_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-muted-foreground">{conv.order_reference || "-"}</TableCell>
                      <TableCell>{fmtCents(conv.order_amount_cents)}</TableCell>
                      <TableCell className="font-medium">{fmtCents(conv.commission_amount_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update campaign details.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
