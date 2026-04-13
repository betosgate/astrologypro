"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserContractRequirement } from "@/lib/contract-orchestration";

export function PendingContractsClient({
  requirements,
}: {
  requirements: UserContractRequirement[];
}) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function acceptRequirement(requirementId: string) {
    setSubmittingId(requirementId);
    try {
      const res = await fetch("/api/legal/contracts/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement_id: requirementId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to accept contract");
      }
      toast.success("Contract accepted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Accept failed");
    } finally {
      setSubmittingId(null);
    }
  }

  const current = requirements[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Contracts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the required agreements below before entering your role-specific portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{current.rendered_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Role: {current.role_key}</span>
            <span>Trigger: {current.trigger_event}</span>
            <span>Pending agreements remaining: {requirements.length}</span>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-6">{current.rendered_content}</pre>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => acceptRequirement(current.id)}
              disabled={submittingId === current.id}
            >
              {submittingId === current.id ? "Accepting..." : "I Accept and Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
