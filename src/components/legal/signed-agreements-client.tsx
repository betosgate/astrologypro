"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SignedAgreementArtifact } from "@/lib/signed-agreements";

function prettyDocumentType(documentType: string) {
  return documentType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSignedDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SignedAgreementsClient({
  agreements,
  mode,
  emptyTitle,
  emptyDescription,
}: {
  agreements: SignedAgreementArtifact[];
  mode: "user" | "admin";
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function emailAgreement(artifactId: string) {
    setSendingId(artifactId);
    try {
      const res = await fetch(`/api/legal/agreements/${artifactId}/email`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to email agreement");
      }
      toast.success(mode === "admin" ? "Agreement emailed to the user" : "Agreement emailed to your account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email failed");
    } finally {
      setSendingId(null);
    }
  }

  if (agreements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{emptyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "admin" ? "Signed Agreements" : "My Signed Agreements"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Signed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{agreement.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {agreement.signer_email ?? "Account email on file"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {prettyDocumentType(agreement.document_type)}
                  </Badge>
                </TableCell>
                <TableCell>{agreement.document_version}</TableCell>
                <TableCell>{formatSignedDate(agreement.accepted_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/legal/signed/${agreement.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/legal/agreements/${agreement.id}/download`}>
                        Download
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => emailAgreement(agreement.id)}
                      disabled={sendingId === agreement.id}
                    >
                      {sendingId === agreement.id ? "Sending..." : "Email"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
