"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  VoicemailIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mask caller phone: +1 XXX-XXX-**** */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    return `+1 ${area}-${prefix}-****`;
  }
  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    return `+1 ${area}-${prefix}-****`;
  }
  // Generic mask: keep first 6 digits, replace rest with ****
  return phone.slice(0, -4).replace(/./g, "*") + "****";
}

function fmtDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Voicemail {
  id: string;
  caller_phone: string;
  s3_key: string;
  duration_seconds: number | null;
  listened_at: string | null;
  created_at: string;
}

interface DivinerVoicemailsProps {
  divinerId: string;
  initialVoicemails: Voicemail[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DivinerVoicemails({
  divinerId,
  initialVoicemails,
}: DivinerVoicemailsProps) {
  const [voicemails] = useState<Voicemail[]>(initialVoicemails);
  const [playingId, setPlayingId] = useState<string | null>(null);

  async function handlePlay(voicemailId: string) {
    setPlayingId(voicemailId);
    try {
      const res = await fetch(`/api/admin/diviners/${divinerId}/voicemails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voicemailId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate playback URL");
        return;
      }
      // Open in new tab — browser audio player
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Network error — could not fetch playback URL");
    } finally {
      setPlayingId(null);
    }
  }

  if (voicemails.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <VoicemailIcon className="size-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">No voicemails</p>
          <p className="text-xs text-muted-foreground mt-1">
            Voicemails left by callers will appear here once the Chime SMA is
            active and a recording flow is configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Caller</TableHead>
            <TableHead>Date &amp; Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Play</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voicemails.map((vm) => (
            <TableRow key={vm.id}>
              <TableCell className="font-mono text-sm">
                {maskPhone(vm.caller_phone)}
              </TableCell>
              <TableCell className="text-sm">
                {fmtDateTime(vm.created_at)}
              </TableCell>
              <TableCell className="text-sm">
                {fmtDuration(vm.duration_seconds)}
              </TableCell>
              <TableCell>
                {vm.listened_at ? (
                  <Badge
                    variant="outline"
                    className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs"
                  >
                    <CheckCircle2 className="size-3" />
                    Listened
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    New
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={playingId === vm.id}
                  onClick={() => handlePlay(vm.id)}
                  aria-label={`Play voicemail from ${maskPhone(vm.caller_phone)}`}
                >
                  {playingId === vm.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
