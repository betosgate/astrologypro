import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [templates, variables, requirements] = await Promise.all([
    admin.from("contract_templates").select("*").order("contract_key", { ascending: true }),
    admin
      .from("contract_template_variables")
      .select("*")
      .order("template_id", { ascending: true })
      .order("sort_order", { ascending: true }),
    admin
      .from("role_contract_requirements")
      .select("*")
      .order("role_key", { ascending: true })
      .order("priority", { ascending: true }),
  ]);

  if (templates.error) return NextResponse.json({ error: templates.error.message }, { status: 500 });
  if (variables.error) return NextResponse.json({ error: variables.error.message }, { status: 500 });
  if (requirements.error) return NextResponse.json({ error: requirements.error.message }, { status: 500 });

  return NextResponse.json({
    templates: templates.data ?? [],
    variables: variables.data ?? [],
    requirements: requirements.data ?? [],
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        template?: Record<string, unknown>;
        variables?: Array<Record<string, unknown>>;
        requirements?: Array<Record<string, unknown>>;
      }
    | null;

  if (!body?.template) {
    return NextResponse.json({ error: "template is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const templatePayload = body.template;
  const contractKey = String(templatePayload.contract_key ?? "").trim();
  const title = String(templatePayload.title ?? "").trim();
  const templateBody = String(templatePayload.template_body ?? "").trim();
  const version = String(templatePayload.version ?? "").trim();
  const roleScope = Array.isArray(templatePayload.role_scope)
    ? templatePayload.role_scope.map((value) => String(value))
    : [];
  const familyKey = String(templatePayload.family_key ?? contractKey).trim() || contractKey;

  if (!contractKey || !title || !templateBody || !version) {
    return NextResponse.json(
      { error: "contract_key, title, template_body, and version are required" },
      { status: 422 },
    );
  }

  const { data: template, error: templateError } = await admin
    .from("contract_templates")
    .insert({
      contract_key: contractKey,
      title,
      role_scope: roleScope,
      template_body: templateBody,
      summary_text: String(templatePayload.summary_text ?? "").trim() || null,
      version,
      effective_date: String(templatePayload.effective_date ?? new Date().toISOString().slice(0, 10)),
      is_active: templatePayload.is_active !== false,
      legacy_document_type: String(templatePayload.legacy_document_type ?? "").trim() || null,
      family_key: familyKey,
      version_kind: String(templatePayload.version_kind ?? "base"),
      amends_template_id: String(templatePayload.amends_template_id ?? "").trim() || null,
      applicability_mode: String(templatePayload.applicability_mode ?? "all_users"),
      is_current_consolidated: templatePayload.is_current_consolidated !== false,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 400 });
  }

  if (Array.isArray(body.variables) && body.variables.length > 0) {
    const inserts = body.variables.map((variable, index) => ({
      template_id: template.id,
      variable_key: String(variable.variable_key ?? "").trim(),
      label: String(variable.label ?? "").trim(),
      source_type: String(variable.source_type ?? "system"),
      default_value: String(variable.default_value ?? "").trim() || null,
      is_required: variable.is_required !== false,
      help_text: String(variable.help_text ?? "").trim() || null,
      sort_order: Number(variable.sort_order ?? index * 10),
    }));
    const { error } = await admin.from("contract_template_variables").insert(inserts);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (Array.isArray(body.requirements) && body.requirements.length > 0) {
    const inserts = body.requirements.map((requirement, index) => ({
      role_key: String(requirement.role_key ?? "").trim(),
      contract_template_id: template.id,
      is_required: requirement.is_required !== false,
      trigger_event: String(requirement.trigger_event ?? "post_login"),
      priority: Number(requirement.priority ?? (index + 1) * 10),
      is_active: requirement.is_active !== false,
    }));
    const { error } = await admin.from("role_contract_requirements").insert(inserts);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ template }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        template?: Record<string, unknown>;
        variables?: Array<Record<string, unknown>>;
        requirements?: Array<Record<string, unknown>>;
      }
    | null;
  if (!body?.template?.id) {
    return NextResponse.json({ error: "template.id is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const templateId = String(body.template.id);
  const { error: templateError } = await admin
    .from("contract_templates")
    .update({
      contract_key: String(body.template.contract_key ?? "").trim(),
      title: String(body.template.title ?? "").trim(),
      role_scope: Array.isArray(body.template.role_scope)
        ? body.template.role_scope.map((value) => String(value))
        : [],
      template_body: String(body.template.template_body ?? "").trim(),
      summary_text: String(body.template.summary_text ?? "").trim() || null,
      version: String(body.template.version ?? "").trim(),
      effective_date: String(body.template.effective_date ?? new Date().toISOString().slice(0, 10)),
      is_active: body.template.is_active !== false,
      legacy_document_type: String(body.template.legacy_document_type ?? "").trim() || null,
      family_key:
        String(body.template.family_key ?? body.template.contract_key ?? "")
          .trim() || String(body.template.contract_key ?? "").trim(),
      version_kind: String(body.template.version_kind ?? "base"),
      amends_template_id: String(body.template.amends_template_id ?? "").trim() || null,
      applicability_mode: String(body.template.applicability_mode ?? "all_users"),
      is_current_consolidated: body.template.is_current_consolidated !== false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 400 });
  }

  await admin.from("contract_template_variables").delete().eq("template_id", templateId);
  await admin.from("role_contract_requirements").delete().eq("contract_template_id", templateId);

  if (Array.isArray(body.variables) && body.variables.length > 0) {
    const inserts = body.variables.map((variable, index) => ({
      template_id: templateId,
      variable_key: String(variable.variable_key ?? "").trim(),
      label: String(variable.label ?? "").trim(),
      source_type: String(variable.source_type ?? "system"),
      default_value: String(variable.default_value ?? "").trim() || null,
      is_required: variable.is_required !== false,
      help_text: String(variable.help_text ?? "").trim() || null,
      sort_order: Number(variable.sort_order ?? index * 10),
    }));
    const { error } = await admin.from("contract_template_variables").insert(inserts);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (Array.isArray(body.requirements) && body.requirements.length > 0) {
    const inserts = body.requirements.map((requirement, index) => ({
      role_key: String(requirement.role_key ?? "").trim(),
      contract_template_id: templateId,
      is_required: requirement.is_required !== false,
      trigger_event: String(requirement.trigger_event ?? "post_login"),
      priority: Number(requirement.priority ?? (index + 1) * 10),
      is_active: requirement.is_active !== false,
    }));
    const { error } = await admin.from("role_contract_requirements").insert(inserts);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
