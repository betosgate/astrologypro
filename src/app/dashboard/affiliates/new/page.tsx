"use client";

// /dashboard/affiliates/new
//
// Form for the diviner to create a new affiliate assignment — pick an
// existing affiliate partnership + a destination (whole profile or one
// service) + commission rate. POSTs to
// /api/dashboard/affiliate-assignments.
//
// Spec: docs/specs/affiliate-commission-system.md §5 Flow A

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, ArrowLeft } from "lucide-react";

interface AffiliateOption {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface ServiceOption {
  id: string;
  name: string;
  category?: string;
}

export default function DashboardAssignAffiliatePage() {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [affiliateId, setAffiliateId] = useState("");
  const [destinationType, setDestinationType] = useState<"PROFILE" | "SERVICE">(
    "PROFILE",
  );
  const [destinationId, setDestinationId] = useState("");
  const [commissionType, setCommissionType] = useState<"percent" | "flat">(
    "percent",
  );
  const [commissionValue, setCommissionValue] = useState("10");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [affRes, svcRes] = await Promise.all([
        fetch("/api/dashboard/affiliates"),
        fetch("/api/dashboard/services?active=true&limit=100"),
      ]);
      if (cancelled) return;
      if (affRes.ok) {
        const j = await affRes.json();
        const rows = (j.data ?? []) as Array<{
          id: string;
          name: string;
          email: string;
          status: string;
        }>;
        // Active partnerships only — pending/blocked can't accept new
        // assignments.
        setAffiliates(rows.filter((r) => r.status === "active"));
      }
      if (svcRes.ok) {
        const j = await svcRes.json();
        setServices((j.services ?? []) as ServiceOption[]);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliateId) {
      toast.error("Pick an affiliate first.");
      return;
    }
    if (destinationType === "SERVICE" && !destinationId) {
      toast.error("Pick a service for SERVICE-scoped assignments.");
      return;
    }
    const valueNum = Number(commissionValue);
    if (!Number.isFinite(valueNum) || valueNum < 0) {
      toast.error("Commission must be a non-negative number.");
      return;
    }
    if (commissionType === "percent" && valueNum > 100) {
      toast.error("Percent commission can't exceed 100.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/affiliate-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliate_id: affiliateId,
          affiliate_type: "diviner_affiliate",
          destination_type: destinationType,
          destination_id:
            destinationType === "PROFILE" ? null : destinationId,
          commission_type: commissionType,
          commission_value: valueNum,
          notes: notes.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        title?: string;
        detail?: string;
      };
      if (!res.ok) {
        toast.error(
          body.detail ?? body.error ?? body.title ?? "Failed to assign",
        );
        setSubmitting(false);
        return;
      }
      toast.success("Affiliate assigned");
      router.push(`/dashboard/affiliates/${affiliateId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/affiliates">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Assign affiliate
          </h1>
          <p className="text-muted-foreground">
            Pick an existing affiliate partnership and a destination — the
            whole profile or a single service.
          </p>
        </div>
      </div>

      {affiliates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-base font-medium">No active affiliates yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              You need at least one active affiliate partnership before you can
              assign products. Send an invitation first.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/affiliates">Invite an affiliate</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partnership</CardTitle>
              <CardDescription>
                Active diviner-affiliate partnerships are listed below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="affiliate">Affiliate</Label>
                <Select
                  value={affiliateId}
                  onValueChange={setAffiliateId}
                  disabled={submitting}
                >
                  <SelectTrigger id="affiliate">
                    <SelectValue placeholder="Pick an affiliate…" />
                  </SelectTrigger>
                  <SelectContent>
                    {affiliates.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} — {a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destination</CardTitle>
              <CardDescription>
                PROFILE attributes any conversion through your public profile.
                SERVICE attributes only one service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination-type">Scope</Label>
                <Select
                  value={destinationType}
                  onValueChange={(v) =>
                    setDestinationType(v as "PROFILE" | "SERVICE")
                  }
                  disabled={submitting}
                >
                  <SelectTrigger id="destination-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROFILE">
                      PROFILE (whole profile)
                    </SelectItem>
                    <SelectItem value="SERVICE">SERVICE (one service)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {destinationType === "SERVICE" && (
                <div className="space-y-2">
                  <Label htmlFor="destination-id">Service</Label>
                  <Select
                    value={destinationId}
                    onValueChange={setDestinationId}
                    disabled={submitting || services.length === 0}
                  >
                    <SelectTrigger id="destination-id">
                      <SelectValue
                        placeholder={
                          services.length === 0
                            ? "No active services"
                            : "Pick a service…"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                          {s.category ? ` · ${s.category}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission</CardTitle>
              <CardDescription>
                The rate stamps onto each new booking. Editing it later only
                affects future bookings — existing ones keep what they were
                stamped with.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commission-type">Type</Label>
                <Select
                  value={commissionType}
                  onValueChange={(v) =>
                    setCommissionType(v as "percent" | "flat")
                  }
                  disabled={submitting}
                >
                  <SelectTrigger id="commission-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="flat">Flat (cents)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission-value">
                  {commissionType === "percent" ? "Percent (%)" : "Cents"}
                </Label>
                <Input
                  id="commission-value"
                  type="number"
                  min="0"
                  step={commissionType === "percent" ? "0.01" : "1"}
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note for your records."
                rows={3}
                disabled={submitting}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button asChild type="button" variant="outline" disabled={submitting}>
              <Link href="/dashboard/affiliates">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Assign
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
