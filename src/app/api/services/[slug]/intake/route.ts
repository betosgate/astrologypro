import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getServiceTemplateToolkitTabSlug,
  normalizeServiceTemplateIntakeState,
  resolveServiceTemplateFormConfig,
  validateServiceTemplateIntakeState,
} from "@/lib/service-template-form";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/services/[slug]/intake">,
) {
  const { slug } = await params;

  let body: { payload?: unknown };
  try {
    body = (await req.json()) as { payload?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: template, error } = await admin
    .from("service_templates")
    .select(
      "id, name, slug, category, is_active, form_enabled, form_config",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const formConfig = resolveServiceTemplateFormConfig({
    category: template.category,
    slug: template.slug,
    form_config: template.form_config,
  });

  if (template.form_enabled === false || !formConfig) {
    return NextResponse.json({ error: "This template does not accept intake submissions." }, { status: 400 });
  }

  const normalizedPayload = normalizeServiceTemplateIntakeState(body.payload);
  if (!normalizedPayload) {
    return NextResponse.json({ error: "Invalid intake payload." }, { status: 400 });
  }

  const validationError = validateServiceTemplateIntakeState(formConfig, normalizedPayload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  const toolkitTabSlug =
    template.category === "astrology" ? getServiceTemplateToolkitTabSlug(template.slug) : null;

  const insertPayload = {
    template_id: template.id,
    template_slug: template.slug,
    template_name: template.name,
    category: template.category,
    toolkit_kind: template.category === "astrology" ? "horoscope" : null,
    toolkit_tab_slug: toolkitTabSlug,
    form_mode: formConfig.mode,
    primary_birth_city: normalizedPayload.person1.city?.label ?? null,
    secondary_birth_city: normalizedPayload.person2.city?.label ?? null,
    area_of_inquiry: normalizedPayload.areaOfInquiry.trim() || null,
    question: normalizedPayload.question.trim() || null,
    future_week: normalizedPayload.futureWeek.trim() || null,
    future_month: normalizedPayload.futureMonth.trim() || null,
    payload: normalizedPayload,
  };

  const { data: submission, error: insertError } = await admin
    .from("service_template_intake_submissions")
    .insert(insertPayload)
    .select("id, template_slug, submitted_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    submission,
    next_url: `/book/demo?template=${encodeURIComponent(template.slug)}&submission=${submission.id}`,
  });
}
