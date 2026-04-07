"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";

interface LinkRow {
  id: string;
  slug: string;
  url: string | null;
  product_type: string | null;
  clicks: number;
  conversions: number;
  is_active: boolean;
  created_at: string;
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available in insecure context
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={handleCopy}
      aria-label="Copy link URL"
    >
      {copied ? (
        <>
          <Check className="size-3 text-green-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy
        </>
      )}
    </Button>
  );
}

export default function AffiliateLinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/affiliate/links");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          setError("You are not registered as an affiliate.");
          return;
        }
        if (!res.ok) {
          const json = await res.json();
          setError((json as { title?: string }).title ?? "Failed to load links.");
          return;
        }
        const json = await res.json() as { data: LinkRow[] };
        setLinks(json.data);
      } catch {
        setError("Unexpected error loading links.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Referral Links</h1>
        <p className="text-muted-foreground">
          Share these links to earn commissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Links</CardTitle>
          <CardDescription>
            {links.length} link{links.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : links.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referral links yet. Contact your diviner to create links.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Product Type</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs">
                        {link.slug}
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {link.product_type ?? "general"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(link.clicks).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(link.conversions).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            link.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {link.is_active ? "active" : "inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {link.url ? (
                          <CopyButton url={link.url} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
