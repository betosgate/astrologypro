// /affiliate/products
// Lists active assignments — one card per [diviner, product] pair the
// caller has been given. Each card has the current commission rate
// and a "Create campaign" CTA.
//
// Server component reads via `resolveAffiliateForCaller` + the same
// query shape as the /api/affiliate/reports/my-products endpoint, so
// the page works without a network round-trip.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  ExternalLink,
  Globe,
  Megaphone,
  Package,
  Plus,
  Star,
} from "lucide-react";

const GENERAL_FALLBACK_IMAGE = "/images/services/natal-chart.png";

export const dynamic = "force-dynamic";

function formatRate(type: "percent" | "flat", value: number): string {
  if (type === "flat") {
    return `$${value.toFixed(2)} per conversion`;
  }
  return `${value}% per sale`;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

export default async function MyProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/products");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) redirect("/login?e=no_affiliate_account");

  const { junctionIds } = ctx;

  // Phase 1.5: general products are visible to every active affiliate
  // regardless of per-diviner partnerships (spec §10 decision #1).
  const { data: generalTemplates } = await admin
    .from("service_templates")
    .select(
      "id, name, slug, description, category, image_url, commission_value, commission_type",
    )
    .eq("is_general", true)
    .eq("affiliate_program_enabled", true)
    .order("name");
  const generalRows = (generalTemplates ?? []) as GeneralTemplateRow[];

  if (junctionIds.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">My products</h1>
          <p className="text-muted-foreground">
            Products diviners have assigned to you. Each one has a commission
            rate and lets you create tracking campaigns.
          </p>
        </header>
        <EmptyState
          title="No partnerships yet"
          body="Once a diviner invites you to be an affiliate and assigns a product, it will show up here."
        />
        {generalRows.length > 0 && (
          <GeneralProductsSection rows={generalRows} />
        )}
      </div>
    );
  }

  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select(
      `id, diviner_id, destination_type, destination_id,
       commission_type, commission_value, is_active, assigned_at, notes,
       diviner:diviners ( id, username, display_name, avatar_url )`,
    )
    .in("affiliate_id", junctionIds)
    .eq("affiliate_type", "diviner_affiliate")
    .eq("is_active", true)
    .order("assigned_at", { ascending: false });

  type Row = {
    id: string;
    diviner_id: string;
    destination_type: "PROFILE" | "SERVICE";
    destination_id: string | null;
    commission_type: "percent" | "flat";
    commission_value: string | number;
    assigned_at: string;
    notes: string | null;
    diviner:
      | { id: string; username: string | null; display_name: string | null; avatar_url: string | null }
      | { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]
      | null;
  };

  const rows = (assignments ?? []) as unknown as Row[];

  const serviceTemplateIds = rows
    .filter((r) => r.destination_type === "SERVICE" && r.destination_id)
    .map((r) => r.destination_id as string);

  const serviceNameById = new Map<string, string>();
  if (serviceTemplateIds.length > 0) {
    const { data: templates } = await admin
      .from("service_templates")
      .select("id, name")
      .in("id", serviceTemplateIds);
    for (const t of templates ?? []) {
      serviceNameById.set(t.id as string, (t.name as string) ?? "Service");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">My products</h1>
        </header>
        <EmptyState
          title="No active assignments"
          body="You have partnerships with diviners but none of them have assigned an active product to you yet."
        />
        {generalRows.length > 0 && (
          <GeneralProductsSection rows={generalRows} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My products</h1>
        <p className="text-muted-foreground">
          {rows.length} active assignment{rows.length === 1 ? "" : "s"}.
          Create a tracking campaign to share a referral link.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => {
          const div = Array.isArray(r.diviner) ? r.diviner[0] : r.diviner;
          const productName =
            r.destination_type === "PROFILE"
              ? `${div?.display_name ?? "Diviner"}'s entire profile`
              : serviceNameById.get(r.destination_id ?? "") ?? "Service";
          return (
            <Card key={r.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="size-10">
                  {div?.avatar_url && <AvatarImage src={div.avatar_url} alt="" />}
                  <AvatarFallback>{initials(div?.display_name ?? "??")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-base">{productName}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge variant="outline" className="text-xs">
                      {div?.display_name ?? "Unknown"}
                    </Badge>
                    <span className="font-medium text-primary">
                      {formatRate(r.commission_type, Number(r.commission_value))}
                    </span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Package className="size-3.5" aria-hidden />
                    {r.destination_type === "PROFILE" ? "Profile" : "Service"}
                  </span>
                  <span>Assigned {formatDate(r.assigned_at)}</span>
                </div>
                {r.notes && (
                  <p className="text-xs italic text-muted-foreground">
                    {r.notes}
                  </p>
                )}
                <div className="mt-auto flex justify-end">
                  <Button asChild size="sm">
                    <Link href={`/affiliate/campaigns/new?assignment=${r.id}`}>
                      <Plus className="size-3.5" aria-hidden />
                      Create campaign
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {generalRows.length > 0 && (
        <GeneralProductsSection rows={generalRows} />
      )}
    </div>
  );
}

type GeneralTemplateRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  commission_value: string | number | null;
  commission_type: "percent" | "flat" | null;
};

function formatGeneralRate(
  type: "percent" | "flat" | null,
  value: string | number | null,
): { display: string; isDefault: boolean } {
  // Phase 1.5 §10 decision #3: NULL value with program enabled means
  // the platform default of 10% is applied at stamp time.
  if (value === null || value === undefined) {
    return { display: "10% (default)", isDefault: true };
  }
  const numeric = Number(value);
  if (type === "flat") {
    return { display: `$${numeric.toFixed(2)} per sale`, isDefault: false };
  }
  return { display: `${numeric}% commission`, isDefault: false };
}

function GeneralProductsSection({ rows }: { rows: GeneralTemplateRow[] }) {
  return (
    <section className="space-y-4 border-t pt-6">
      <header>
        <h2 className="text-xl font-bold tracking-tight inline-flex items-center gap-2">
          <Globe className="size-5" aria-hidden />
          General products you can promote
        </h2>
        <p className="text-sm text-muted-foreground">
          Available to all active affiliates. The commission rate is set by
          the platform and can change without notice — the rate stamped on
          a booking at checkout is what pays out.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => {
          const rate = formatGeneralRate(t.commission_type, t.commission_value);
          const categoryRaw = (t.category ?? "").trim();
          const categoryKey = categoryRaw.toLowerCase();
          const isAstrology = categoryKey === "astrology";
          const isTarot = categoryKey === "tarot";
          return (
            <Card key={t.id} className="flex flex-col overflow-hidden">
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                <Image
                  src={t.image_url ?? GENERAL_FALLBACK_IMAGE}
                  alt={t.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
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
                          <Star className="mr-0.5 size-2.5" aria-hidden />
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
                    className="bg-emerald-100 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {rate.display}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-tight">
                  {t.name}
                </CardTitle>
                {t.description && (
                  <CardDescription className="line-clamp-3 text-xs leading-relaxed">
                    {t.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-end gap-2 pt-0 text-sm">
                <Button asChild variant="outline" size="sm" className="h-8">
                  <a
                    href={`/services/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Preview ${t.name} (does not log a click)`}
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    Preview
                  </a>
                </Button>
                <Button asChild size="sm" className="h-8">
                  <Link href={`/affiliate/campaigns/new?template=${t.id}`}>
                    <Plus className="size-3.5" aria-hidden />
                    Create campaign
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Megaphone className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {body}
        </p>
      </CardContent>
    </Card>
  );
}
