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
import { Progress } from "@/components/ui/progress";
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
  Trash2,
  UserPlus,
  UserMinus,
  DollarSign,
  Target,
  Users,
  Calendar,
} from "lucide-react";
import { CampaignUrlDisplay } from "@/components/dashboard/campaign-url-display";
import { CampaignAutoPauseBanner } from "@/components/dashboard/campaign-auto-pause-banner";
import { CampaignDestinationBadge } from "@/components/dashboard/campaign-destination-badge";

interface CampaignAffiliate {
  id: string;
  campaign_id: string;
  affiliate_id: string;
  affiliate_type: string;
  custom_commission_value: number | null;
  joined_at: string;
  name: string;
  conversions: number;
  commission_cents: number;
}

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
  affiliates: CampaignAffiliate[];
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
  const [addAffOpen, setAddAffOpen] = useState(false);
  const [addAffSaving, setAddAffSaving] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editCommType, setEditCommType] = useState("");
  const [editCommValue, setEditCommValue] = useState("");
  const [editBudgetCap, setEditBudgetCap] = useState("");

  // Add affiliate form
  const [addAffId, setAddAffId] = useState("");
  const [addAffType, setAddAffType] = useState("diviner_affiliate");
  const [addAffCommission, setAddAffCommission] = useState("");

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
    setEditCommType(campaign.commission_type);
    setEditCommValue(String(campaign.commission_value));
    setEditBudgetCap(campaign.budget_cap_cents ? String(campaign.budget_cap_cents / 100) : "");
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
        commission_type: editCommType,
        commission_value: parseFloat(editCommValue) || 0,
        budget_cap_cents: editBudgetCap ? parseInt(editBudgetCap, 10) * 100 : null,
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

  async function handleDelete() {
    if (!campaign || campaign.status !== "draft") return;
    if (!confirm("Delete this draft campaign?")) return;
    const res = await fetch(`/api/dashboard/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campaign deleted");
      window.location.href = "/dashboard/campaigns";
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to delete");
    }
  }

  async function handleAddAffiliate() {
    if (!addAffId.trim()) {
      toast.error("Affiliate ID is required");
      return;
    }
    setAddAffSaving(true);
    const res = await fetch(`/api/dashboard/campaigns/${id}/affiliates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        affiliate_id: addAffId.trim(),
        affiliate_type: addAffType,
        custom_commission_value: addAffCommission ? parseFloat(addAffCommission) : undefined,
      }),
    });
    if (res.ok) {
      toast.success("Affiliate added to campaign");
      setAddAffOpen(false);
      setAddAffId("");
      setAddAffCommission("");
      await loadCampaign();
    } else {
      const err = await res.json();
      toast.error(err.title ?? "Failed to add affiliate");
    }
    setAddAffSaving(false);
  }

  async function handleRemoveAffiliate(affiliateId: string, affiliateType: string) {
    if (!confirm("Remove this affiliate from the campaign?")) return;
    const res = await fetch(`/api/dashboard/campaigns/${id}/affiliates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliate_id: affiliateId, affiliate_type: affiliateType }),
    });
    if (res.ok) {
      toast.success("Affiliate removed");
      await loadCampaign();
    } else {
      toast.error("Failed to remove affiliate");
    }
  }

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

  const budgetPercent = campaign.budget_cap_cents
    ? Math.min(100, Math.round((campaign.spent_cents / campaign.budget_cap_cents) * 100))
    : 0;

  const totalConversionCommission = campaign.conversions.reduce((s, c) => s + c.commission_amount_cents, 0);

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
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="mr-2 size-3.5" />Edit
          </Button>
          {campaign.status === "draft" && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 size-3.5" />Delete
            </Button>
          )}
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
                label="Campaign URL"
                showOpenButton
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaign Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.affiliates.length}</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtCents(totalConversionCommission)}</p>
            <p className="text-xs text-muted-foreground">
              {campaign.commission_type === "percentage"
                ? `${campaign.commission_value}% rate`
                : `$${Number(campaign.commission_value).toFixed(2)} fixed`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {campaign.budget_cap_cents && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{fmtCents(campaign.spent_cents)} spent</span>
              <span className="text-sm font-medium">{fmtCents(campaign.budget_cap_cents)} budget</span>
            </div>
            <Progress value={budgetPercent} className="h-3" />
            <p className="mt-1 text-xs text-muted-foreground">{budgetPercent}% utilized</p>
          </CardContent>
        </Card>
      )}

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

      {/* Enrolled Affiliates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Enrolled Affiliates</CardTitle>
            <CardDescription>{campaign.affiliates.length} affiliate{campaign.affiliates.length !== 1 ? "s" : ""}</CardDescription>
          </div>
          <Dialog open={addAffOpen} onOpenChange={setAddAffOpen}>
            <Button variant="outline" size="sm" onClick={() => setAddAffOpen(true)}>
              <UserPlus className="mr-2 size-3.5" />Add Affiliate
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Affiliate to Campaign</DialogTitle>
                <DialogDescription>Enter the affiliate ID to enroll them in this campaign.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Affiliate ID</Label>
                  <Input value={addAffId} onChange={(e) => setAddAffId(e.target.value)} placeholder="UUID of the affiliate" />
                </div>
                <div className="space-y-2">
                  <Label>Affiliate Type</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={addAffType} onChange={(e) => setAddAffType(e.target.value)}>
                    <option value="diviner_affiliate">Diviner Affiliate</option>
                    <option value="social_advocate">Social Advocate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Custom Commission Override (optional)</Label>
                  <Input type="number" min="0" value={addAffCommission} onChange={(e) => setAddAffCommission(e.target.value)} placeholder="Leave blank to use campaign default" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAffiliate} disabled={addAffSaving}>
                  {addAffSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                  Add to Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campaign.affiliates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No affiliates enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Custom Commission</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Commission Earned</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.affiliates.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell className="font-medium">{aff.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{aff.affiliate_type === "diviner_affiliate" ? "Affiliate" : "Advocate"}</Badge>
                      </TableCell>
                      <TableCell>
                        {aff.custom_commission_value !== null ? `${aff.custom_commission_value}%` : "Default"}
                      </TableCell>
                      <TableCell>{aff.conversions}</TableCell>
                      <TableCell>{fmtCents(aff.commission_cents)}</TableCell>
                      <TableCell>{fmtDate(aff.joined_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          title="Remove from campaign"
                          onClick={() => handleRemoveAffiliate(aff.affiliate_id, aff.affiliate_type)}
                        >
                          <UserMinus className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission Type</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editCommType} onChange={(e) => setEditCommType(e.target.value)}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{editCommType === "percentage" ? "Commission %" : "Fixed ($)"}</Label>
                <Input type="number" min="0" value={editCommValue} onChange={(e) => setEditCommValue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget Cap ($)</Label>
              <Input type="number" min="0" value={editBudgetCap} onChange={(e) => setEditBudgetCap(e.target.value)} placeholder="Leave blank for unlimited" />
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
