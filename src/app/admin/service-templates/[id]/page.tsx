import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TemplateForm } from "../_components/template-form";
import type { TemplateFormData } from "../_components/template-form";
import { TemplatePublicUrlActions } from "../_components/template-public-url-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_URL } from "@/lib/constants";
import {
  getServiceTemplatePublicPath,
  isGeneralServiceTemplateSlug,
} from "@/lib/service-template-public";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getTemplate(id: string) {
  const admin = createAdminClient();

  const { data: template } = await admin
    .from("service_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!template) return null;

  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select(`
      is_enabled,
      diviners ( id, display_name )
    `)
    .eq("template_id", id)
    .eq("is_enabled", true);

  return {
    template,
    divinerCount: divinerServices?.length ?? 0,
    diviners: (divinerServices ?? []).map((ds) => ds.diviners),
  };
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await getTemplate(id);
  return {
    title: result
      ? `Edit: ${result.template.name} | Admin`
      : "Service Template | Admin",
  };
}

export default async function EditServiceTemplatePage({ params }: Props) {
  const { id } = await params;
  const result = await getTemplate(id);
  if (!result) notFound();

  const { template, divinerCount, diviners } = result;
  const isGeneralTemplate = isGeneralServiceTemplateSlug(template.slug ?? "");
  const publicUrl = `${APP_URL}${getServiceTemplatePublicPath(template.slug)}`;

  // Map DB record to form shape
  const initialData: Partial<TemplateFormData> = {
    name:              template.name ?? "",
    slug:              template.slug ?? "",
    category:          template.category ?? "",
    description:       template.description ?? "",
    long_description:  template.long_description ?? "",
    base_price:        template.base_price?.toString() ?? "",
    overage_rate:      template.overage_rate?.toString() ?? "",
    duration_minutes:  template.duration_minutes?.toString() ?? "",
    is_primary:        template.is_primary ?? false,
    requires_birth_data: template.requires_birth_data ?? false,
    trigger_event:     template.trigger_event ?? "",
    display_order:     (template.display_order ?? template.sort_order ?? 0).toString(),
    icon_name:         template.icon_name ?? "",
    color:             template.color ?? "",
    whats_included:    template.whats_included ?? [],
    who_its_for:       template.who_its_for ?? [],
    faq:               Array.isArray(template.faq) ? template.faq : [],
    seo_title:         template.seo_title ?? "",
    seo_description:   template.seo_description ?? "",
    is_active:         template.is_active ?? true,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/admin/service-templates">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Templates
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {template.slug}
            </code>
            <Badge
              variant="outline"
              className={
                template.category === "astrology"
                  ? "border-amber-500 text-amber-700 dark:text-amber-400"
                  : "border-violet-500 text-violet-700 dark:text-violet-400"
              }
            >
              {template.category === "astrology" ? "⭐ Astrology" : "🃏 Tarot"}
            </Badge>
            {!template.is_active && (
              <Badge variant="destructive" className="text-xs">Inactive</Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 text-right">
          {isGeneralTemplate && (
            <div className="flex justify-end">
              <TemplatePublicUrlActions publicUrl={publicUrl} disabled={!template.is_active} />
            </div>
          )}
          {divinerCount > 0 && (
            <div>
              <div className="text-2xl font-bold">{divinerCount}</div>
              <div className="text-xs text-muted-foreground">
                diviner{divinerCount !== 1 ? "s" : ""} using this
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diviner list */}
      {diviners.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            DIVINERS WITH THIS TEMPLATE ENABLED
          </p>
          <div className="flex flex-wrap gap-1.5">
            {diviners.map((d) => (
              <Badge key={(d as { id: string }).id} variant="secondary" className="text-xs">
                {(d as { display_name: string }).display_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="rounded-lg border bg-card p-6">
        <TemplateForm
          initialData={initialData}
          templateId={template.id}
          divinerCount={divinerCount}
        />
      </div>
    </div>
  );
}
