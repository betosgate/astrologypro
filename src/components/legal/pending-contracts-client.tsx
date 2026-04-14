"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UserContractRequirement } from "@/lib/contract-orchestration";

/* ── Lightweight markdown → HTML converter ─────────────────────────── */

function inlineMarkdown(text: string): string {
  let out = text;
  // escape HTML entities
  out = out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // bold
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // italic
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // inline code
  out = out.replace(/`(.+?)`/g, "<code>$1</code>");
  // links [text](url)
  out = out.replace(
    /\[(.+?)\]\((https?:\/\/.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let paragraphBuf: string[] = [];

  function flushParagraph() {
    if (paragraphBuf.length > 0) {
      out.push(`<p>${paragraphBuf.join(" ")}</p>`);
      paragraphBuf = [];
    }
  }

  function closeList() {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  }

  for (const raw of lines) {
    const line = raw;

    // headings
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    // unordered list
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    // blank line → flush paragraph
    if (line.trim() === "") {
      flushParagraph();
      closeList();
      continue;
    }

    // regular text → accumulate for paragraph
    closeList();
    paragraphBuf.push(inlineMarkdown(line));
  }

  flushParagraph();
  closeList();
  return out.join("\n");
}

/* ── Component ─────────────────────────────────────────────────────── */

export function PendingContractsClient({
  requirements,
}: {
  requirements: UserContractRequirement[];
}) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = requirements[0];
  const contentHtml = useMemo(
    () => markdownToHtml(current.rendered_content ?? ""),
    [current.rendered_content],
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "at bottom" when within 20px of the end
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    if (atBottom) setHasScrolledToBottom(true);
  }, []);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Contracts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the required agreements below before entering your role-specific portal.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-xl">{current.rendered_title}</CardTitle>
          {requirements.length > 1 && (
            <p className="text-sm text-muted-foreground">
              {requirements.length} agreements remaining
            </p>
          )}
          <Separator />
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-[60vh] overflow-y-auto rounded-lg border bg-muted/10 p-6"
          >
            <div
              className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:tracking-tight
                prose-h1:text-2xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
                prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2
                prose-h3:text-base prose-h3:mt-4
                prose-p:leading-relaxed prose-p:text-muted-foreground
                prose-strong:text-foreground
                prose-li:text-muted-foreground
                prose-a:text-primary prose-a:underline prose-a:underline-offset-4
                prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {hasScrolledToBottom
                ? "By clicking accept, you agree to the terms above."
                : "Please scroll to the bottom to read the full contract before accepting."}
            </p>
            <Button
              size="lg"
              onClick={() => acceptRequirement(current.id)}
              disabled={!hasScrolledToBottom || submittingId === current.id}
            >
              {submittingId === current.id ? "Accepting..." : "I Accept and Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
