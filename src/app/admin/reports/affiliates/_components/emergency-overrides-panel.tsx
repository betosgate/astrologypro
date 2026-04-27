"use client";

// Emergency overrides — Flow K. The admin pastes an assignment-id or
// campaign-id, opens the reason modal, and confirms. Lives on the
// overview page since there's no admin-side assignments/campaigns list
// today; if/when those land, the buttons can move to per-row context
// alongside the existing Reverse-conversion button.
//
// Spec: docs/specs/affiliate-commission-system.md §5 Flow K

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, ShieldAlert, XCircle } from "lucide-react";
import { OverrideActionButton } from "./override-action-button";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function EmergencyOverridesPanel() {
  const [assignmentId, setAssignmentId] = useState("");
  const [campaignId, setCampaignId] = useState("");

  const assignmentValid = UUID_RE.test(assignmentId.trim());
  const campaignValid = UUID_RE.test(campaignId.trim());

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4 text-destructive" aria-hidden />
          Emergency overrides
        </CardTitle>
        <CardDescription>
          Force-revoke an affiliate assignment or archive an affiliate-owned
          campaign on behalf of the owner. Each action writes to{" "}
          <code className="font-mono">admin_action_log</code> and notifies
          both the affiliate and the diviner. Use sparingly.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="revoke-assignment-id">Assignment ID</Label>
          <Input
            id="revoke-assignment-id"
            placeholder="diviner_service_affiliates.id"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value.trim())}
            className="font-mono text-xs"
          />
          <OverrideActionButton
            endpoint={`/api/admin/affiliate-assignments/${assignmentId.trim()}/revoke`}
            method="POST"
            buttonLabel="Revoke assignment"
            buttonVariant="destructive"
            buttonIcon={<XCircle className="mr-1.5 size-3.5" aria-hidden />}
            disabled={!assignmentValid}
            dialogTitle="Force-revoke this assignment"
            dialogDescription="Sets is_active=false on diviner_service_affiliates. The auto-pause trigger will pause any dependent affiliate-owned campaigns. Existing earnings are not affected."
            confirmLabel="Revoke"
            successToast="Assignment revoked"
          />
          {assignmentId.trim() && !assignmentValid && (
            <p className="text-xs text-destructive">
              Not a valid UUID.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="archive-campaign-id">Campaign ID</Label>
          <Input
            id="archive-campaign-id"
            placeholder="affiliate_campaigns.id"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value.trim())}
            className="font-mono text-xs"
          />
          <OverrideActionButton
            endpoint={`/api/admin/affiliate-campaigns/${campaignId.trim()}/archive`}
            method="POST"
            buttonLabel="Archive campaign"
            buttonVariant="destructive"
            buttonIcon={<Archive className="mr-1.5 size-3.5" aria-hidden />}
            disabled={!campaignValid}
            dialogTitle="Force-archive this campaign"
            dialogDescription="Sets affiliate_campaigns.status='archived'. The share link stops resolving. Existing conversions stay intact."
            confirmLabel="Archive"
            successToast="Campaign archived"
          />
          {campaignId.trim() && !campaignValid && (
            <p className="text-xs text-destructive">Not a valid UUID.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
