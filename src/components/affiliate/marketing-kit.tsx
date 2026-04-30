"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketingKitItem } from "@/lib/affiliate-marketing-kit";

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard not available in insecure context
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs flex-1"
      onClick={handleCopy}
      aria-label="Copy affiliate link"
    >
      {copied ? (
        <>
          <Check className="size-3 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy Link
        </>
      )}
    </Button>
  );
}

interface AffiliateMarketingKitProps {
  items: MarketingKitItem[];
}

const FALLBACK_IMAGE = "/images/services/natal-chart.png";

export function AffiliateMarketingKit({ items }: AffiliateMarketingKitProps) {
  // Build the filter list from the actual data. Filter comparison is
  // case-insensitive; display preserves the canonical casing from the
  // first occurrence so admin-stored "Astrology" doesn't get mangled.
  const categories = useMemo(() => {
    const canonical = new Map<string, string>();
    for (const it of items) {
      const raw = it.template.category?.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!canonical.has(key)) canonical.set(key, raw);
    }
    return Array.from(canonical.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [items]);

  const [filter, setFilter] = useState<string>("all");

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(
      (it) => (it.template.category ?? "").toLowerCase() === filter,
    );
  }, [items, filter]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    map.set("all", items.length);
    for (const it of items) {
      const c = (it.template.category ?? "").toLowerCase();
      if (c) map.set(c, (map.get(c) ?? 0) + 1);
    }
    return map;
  }, [items]);

  function formatRateBadge(item: MarketingKitItem): string {
    const v = item.effectiveRate;
    const suffix = item.isDefaultRate ? " (default)" : "";
    if (item.effectiveRateType === "flat") {
      return `$${v.toFixed(2)} per sale${suffix}`;
    }
    return `${v}% commission${suffix}`;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Marketing Kit
          </h2>
          <p className="text-sm text-muted-foreground">
            Share these landing pages to earn commissions. Each link is tied to
            a real campaign code so the system credits you when someone books.
          </p>
        </div>

        {/* Filter tabs — sourced from service_templates.category */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All&nbsp;
            <span className="opacity-60">({counts.get("all") ?? 0})</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFilter(cat.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === cat.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}&nbsp;
              <span className="opacity-60">({counts.get(cat.key) ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const t = item.template;
          const categoryRaw = (t.category ?? "").trim();
          const categoryKey = categoryRaw.toLowerCase();
          const isAstrology = categoryKey === "astrology";
          const isTarot = categoryKey === "tarot";
          return (
            <Card key={t.id} className="overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <div className="relative h-36 w-full bg-muted overflow-hidden">
                <Image
                  src={t.image_url ?? FALLBACK_IMAGE}
                  alt={t.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Category + rate badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {categoryRaw && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-semibold ${
                        isAstrology
                          ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
                          : isTarot
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {isAstrology ? (
                        <>
                          <Star className="size-2.5 mr-0.5" />
                          Astrology
                        </>
                      ) : isTarot ? (
                        <>🃏 Tarot</>
                      ) : (
                        categoryRaw
                      )}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold dark:bg-emerald-950 dark:text-emerald-300"
                    aria-label={formatRateBadge(item)}
                  >
                    {formatRateBadge(item)}
                  </Badge>
                </div>
              </div>

              <CardContent className="flex flex-col flex-1 gap-3 p-4">
                {/* Title + description */}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-tight">
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Affiliate URL preview */}
                <div className="rounded-md border bg-muted px-2.5 py-1.5 overflow-hidden">
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {item.shareUrl}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <CopyLinkButton url={item.shareUrl} />
                  <a
                    href={item.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={`Preview ${t.name} (does not log a click)`}
                  >
                    <ExternalLink className="size-3" />
                    Preview
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
