import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ensureSignedAgreementArtifactForAcceptance,
  getSignedAgreementArtifact,
  resolveSignerProfile,
} from "@/lib/signed-agreements";

export interface ContractTemplate {
  id: string;
  contract_key: string;
  title: string;
  role_scope: string[];
  template_body: string;
  summary_text: string | null;
  version: string;
  effective_date: string;
  is_active: boolean;
  legacy_document_type: string | null;
  family_key: string;
  version_kind: "base" | "amendment" | "consolidated";
  amends_template_id: string | null;
  applicability_mode: "all_users" | "existing_users_snapshot" | "future_users_only";
  is_current_consolidated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplateVariable {
  id: string;
  template_id: string;
  variable_key: string;
  label: string;
  source_type: "system" | "user_profile" | "role_profile" | "runtime";
  default_value: string | null;
  is_required: boolean;
  help_text: string | null;
  sort_order: number;
}

export interface RoleContractRequirement {
  id: string;
  role_key: string;
  contract_template_id: string;
  is_required: boolean;
  trigger_event: "signup" | "post_login" | "before_role_activation" | "before_payout";
  priority: number;
  is_active: boolean;
}

export interface UserContractRequirement {
  id: string;
  user_id: string;
  role_key: string;
  contract_template_id: string;
  requirement_source: string;
  rendered_title: string;
  rendered_content: string;
  rendered_variables: Record<string, unknown>;
  content_hash: string;
  status: "pending" | "accepted" | "waived" | "superseded";
  blocking: boolean;
  trigger_event: "signup" | "post_login" | "before_role_activation" | "before_payout";
  accepted_artifact_id: string | null;
  rollout_id: string | null;
  upgrades_prior_requirement_id: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractAmendmentRollout {
  id: string;
  amendment_template_id: string;
  target_roles: string[];
  rollout_state: "draft" | "active" | "paused" | "superseded";
  audience_mode: "existing_users_snapshot";
  activated_at: string | null;
  activated_by: string | null;
  paused_at: string | null;
  superseded_at: string | null;
  consolidated_template_id: string | null;
  affected_user_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  status_counts?: Record<string, number>;
  amendment_template?: ContractTemplate | null;
  consolidated_template?: ContractTemplate | null;
}

const SYSTEM_VARIABLES: Record<string, string> = {
  company_name: process.env.NEXT_PUBLIC_APP_NAME ?? "AstrologyPro",
  support_email: process.env.SUPPORT_EMAIL ?? "support@astrologypro.com",
};

function replacePlaceholders(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    return variables[key] ?? "";
  });
}

function buildContentHash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isTransientContractLookupError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return /fetch failed|network|econnreset|etimedout|enotfound|und_err/i.test(
    message,
  );
}

async function fetchRoleProfileValue(userId: string, roleKey: string, key: string) {
  const admin = createAdminClient();
  switch (roleKey) {
    case "diviner": {
      const { data } = await admin
        .from("diviners")
        .select("display_name, phone, username")
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return null;
      const map: Record<string, string | null> = {
        signer_name: data.display_name ?? null,
        role_title: "Diviner",
        username: data.username ?? null,
        phone: data.phone ?? null,
      };
      return map[key] ?? null;
    }
    case "trainee": {
      const { data } = await admin
        .from("trainees")
        .select("name, phone, username")
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return null;
      const map: Record<string, string | null> = {
        signer_name: data.name ?? null,
        role_title: "Trainee",
        username: data.username ?? null,
        phone: data.phone ?? null,
      };
      return map[key] ?? null;
    }
    case "advocate": {
      const { data } = await admin
        .from("social_advocates")
        .select("name, email, username")
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return null;
      const map: Record<string, string | null> = {
        signer_name: data.name ?? null,
        signer_email: data.email ?? null,
        role_title: "Advocate",
        username: data.username ?? null,
      };
      return map[key] ?? null;
    }
    case "community":
    case "mystery_school":
    case "client": {
      const { data } = await admin
        .from("community_members")
        .select("full_name, email")
        .eq("user_id", userId)
        .maybeSingle();

      if (!data) return null;
      const map: Record<string, string | null> = {
        signer_name: data.full_name ?? null,
        signer_email: data.email ?? null,
        role_title: roleKey === "mystery_school" ? "Mystery School Member" : "Member",
      };
      return map[key] ?? null;
    }
    default:
      return null;
  }
}

async function resolveVariableValue(params: {
  userId: string;
  roleKey: string;
  variable: ContractTemplateVariable;
  template: ContractTemplate;
}) {
  const { userId, roleKey, variable, template } = params;
  const { signerEmail, signerName } = await resolveSignerProfile(userId);

  if (variable.variable_key === "effective_date") {
    return template.effective_date;
  }

  switch (variable.source_type) {
    case "system":
      return SYSTEM_VARIABLES[variable.variable_key] ?? variable.default_value ?? "";
    case "user_profile":
      if (variable.variable_key === "signer_name") {
        return signerName ?? variable.default_value ?? "";
      }
      if (variable.variable_key === "signer_email") {
        return signerEmail ?? variable.default_value ?? "";
      }
      return variable.default_value ?? "";
    case "role_profile": {
      return (
        (await fetchRoleProfileValue(userId, roleKey, variable.variable_key)) ??
        variable.default_value ??
        ""
      );
    }
    case "runtime":
      return variable.default_value ?? "";
    default:
      return variable.default_value ?? "";
  }
}

export async function resolveUserRoleKeys(userId: string) {
  const admin = createAdminClient();
  const [diviner, client, advocate, community, mystery, trainee] = await Promise.all([
    admin.from("diviners").select("id").eq("user_id", userId).maybeSingle(),
    admin.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    admin.from("social_advocates").select("id").eq("user_id", userId).maybeSingle(),
    admin.from("community_members").select("id, membership_type, membership_status").eq("user_id", userId).maybeSingle(),


    admin.from("mystery_school_students").select("id, status, access_expires_at").eq("user_id", userId).maybeSingle(),
    admin.from("trainees").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  const roles: string[] = [];
  if (client.data) roles.push("client");
  if (diviner.data) roles.push("diviner");
  if (advocate.data) roles.push("advocate");
  if (trainee.data) roles.push("trainee");
  if (
    community.data &&
    community.data.membership_type === "perennial_mandalism" &&
    community.data.membership_status === "active"
  ) {
    roles.push("community");
  }
  if (
    mystery.data &&
    (mystery.data.status === "active" ||
      (mystery.data.status === "cancelled" &&
        mystery.data.access_expires_at &&
        new Date(mystery.data.access_expires_at) > new Date()))
  ) {
    roles.push("mystery_school");
  }
  return roles;
}

export async function listContractTemplates() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contract_templates")
    .select("*")
    .order("contract_key", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractTemplate[];
}

export async function listContractVariables() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contract_template_variables")
    .select("*")
    .order("template_id", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractTemplateVariable[];
}

export async function listRoleContractRequirements() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_contract_requirements")
    .select("*")
    .order("role_key", { ascending: true })
    .order("priority", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleContractRequirement[];
}

export async function listContractAmendmentRollouts() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contract_amendment_rollouts")
    .select(
      `
        *,
        amendment_template:contract_templates!contract_amendment_rollouts_amendment_template_id_fkey(*),
        consolidated_template:contract_templates!contract_amendment_rollouts_consolidated_template_id_fkey(*)
      `,
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rollouts = (data ?? []) as ContractAmendmentRollout[];
  const rolloutIds = rollouts.map((entry) => entry.id);
  if (rolloutIds.length === 0) {
    return rollouts;
  }

  const { data: requirements, error: requirementError } = await admin
    .from("user_contract_requirements")
    .select("rollout_id, status")
    .in("rollout_id", rolloutIds);
  if (requirementError) throw new Error(requirementError.message);

  const countsByRolloutId = new Map<string, Record<string, number>>();
  for (const requirement of requirements ?? []) {
    if (!requirement.rollout_id) continue;
    const current = countsByRolloutId.get(requirement.rollout_id) ?? {};
    current[requirement.status] = (current[requirement.status] ?? 0) + 1;
    countsByRolloutId.set(requirement.rollout_id, current);
  }

  return rollouts.map((rollout) => ({
    ...rollout,
    status_counts: countsByRolloutId.get(rollout.id) ?? {},
  }));
}

async function listUserIdsForRole(roleKey: string) {
  const admin = createAdminClient();

  switch (roleKey) {
    case "diviner": {
      const { data, error } = await admin.from("diviners").select("user_id");
      if (error) throw new Error(error.message);
      return (data ?? []).map((entry) => entry.user_id).filter(Boolean) as string[];
    }
    case "trainee": {
      const { data, error } = await admin.from("trainees").select("user_id");
      if (error) throw new Error(error.message);
      return (data ?? []).map((entry) => entry.user_id).filter(Boolean) as string[];
    }
    case "advocate": {
      const { data, error } = await admin.from("social_advocates").select("user_id");
      if (error) throw new Error(error.message);
      return (data ?? []).map((entry) => entry.user_id).filter(Boolean) as string[];
    }
    case "client": {
      const { data, error } = await admin.from("clients").select("user_id");
      if (error) throw new Error(error.message);
      return (data ?? []).map((entry) => entry.user_id).filter(Boolean) as string[];
    }
    case "community": {
      const { data, error } = await admin
        .from("community_members")
        .select("user_id")
        .eq("membership_status", "active");

      if (error) throw new Error(error.message);
      return (data ?? []).map((entry) => entry.user_id).filter(Boolean) as string[];
    }
    case "mystery_school": {
      const { data, error } = await admin
        .from("mystery_school_students")
        .select("user_id, status, access_expires_at");
      if (error) throw new Error(error.message);
      return (data ?? [])
        .filter(
          (entry) =>
            entry.user_id &&
            (entry.status === "active" ||
              (entry.status === "cancelled" &&
                entry.access_expires_at &&
                new Date(entry.access_expires_at) > new Date())),
        )
        .map((entry) => entry.user_id) as string[];
    }
    default:
      return [];
  }
}

export async function previewAmendmentAudience(targetRoles: string[]) {
  const roleUserEntries = await Promise.all(
    targetRoles.map(async (roleKey) => ({
      roleKey,
      userIds: await listUserIdsForRole(roleKey),
    })),
  );

  const uniqueUserIds = new Set<string>();
  for (const entry of roleUserEntries) {
    for (const userId of entry.userIds) {
      uniqueUserIds.add(userId);
    }
  }

  return {
    roleBreakdown: roleUserEntries.map((entry) => ({
      roleKey: entry.roleKey,
      userCount: entry.userIds.length,
    })),
    uniqueUserCount: uniqueUserIds.size,
  };
}

async function findLatestAcceptedRequirementForFamily(params: {
  userId: string;
  roleKey: string;
  familyKey: string;
}) {
  const admin = createAdminClient();
  const { data: acceptedRequirements, error } = await admin
    .from("user_contract_requirements")
    .select("id, contract_template_id, fulfilled_at")
    .eq("user_id", params.userId)
    .eq("role_key", params.roleKey)
    .eq("status", "accepted")
    .order("fulfilled_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  if (!acceptedRequirements || acceptedRequirements.length === 0) {
    return null;
  }

  const templateIds = acceptedRequirements.map((entry) => entry.contract_template_id);
  const { data: templates, error: templateError } = await admin
    .from("contract_templates")
    .select("id, family_key")
    .in("id", templateIds);

  if (templateError) throw new Error(templateError.message);
  const familyByTemplateId = new Map((templates ?? []).map((entry) => [entry.id, entry.family_key]));

  return (
    acceptedRequirements.find(
      (entry) => familyByTemplateId.get(entry.contract_template_id) === params.familyKey,
    ) ?? null
  );
}

export async function renderContractTemplateForUser(params: {
  userId: string;
  roleKey: string;
  template: ContractTemplate;
  variables: ContractTemplateVariable[];
}) {
  const resolvedEntries = await Promise.all(
    params.variables.map(async (variable) => [
      variable.variable_key,
      await resolveVariableValue({
        userId: params.userId,
        roleKey: params.roleKey,
        variable,
        template: params.template,
      }),
    ]),
  );

  const resolvedVariables = Object.fromEntries(
    resolvedEntries.map(([key, value]) => [key, String(value ?? "")]),
  );

  const renderedTitle = replacePlaceholders(params.template.title, resolvedVariables);
  const renderedContent = replacePlaceholders(
    params.template.template_body,
    resolvedVariables,
  );
  const contentHash = buildContentHash(
    `${renderedTitle}|${params.template.version}|${renderedContent}`,
  );

  return {
    renderedTitle,
    renderedContent,
    renderedVariables: resolvedVariables,
    contentHash,
  };
}

export async function ensureUserContractRequirements(
  userId: string,
  triggerEvent: "signup" | "post_login" | "before_role_activation" | "before_payout" = "post_login",
) {
  const admin = createAdminClient();
  const [roles, templates, variables, requirements, existing] = await Promise.all([
    resolveUserRoleKeys(userId),
    listContractTemplates(),
    listContractVariables(),
    listRoleContractRequirements(),
    admin
      .from("user_contract_requirements")
      .select("*")
      .eq("user_id", userId),
  ]);

  const templateById = new Map(templates.map((template) => [template.id, template]));
  const currentTemplateByFamily = new Map<string, ContractTemplate>();
  for (const template of templates) {
    if (
      !template.is_active ||
      template.applicability_mode === "existing_users_snapshot" ||
      !template.is_current_consolidated
    ) {
      continue;
    }
    const existing = currentTemplateByFamily.get(template.family_key);
    if (
      !existing ||
      (existing.version_kind !== "consolidated" && template.version_kind === "consolidated") ||
      new Date(template.effective_date) > new Date(existing.effective_date)
    ) {
      currentTemplateByFamily.set(template.family_key, template);
    }
  }
  const variablesByTemplateId = new Map<string, ContractTemplateVariable[]>();
  for (const variable of variables) {
    const current = variablesByTemplateId.get(variable.template_id) ?? [];
    current.push(variable);
    variablesByTemplateId.set(variable.template_id, current);
  }

  const existingRequirements = (existing.data ?? []) as UserContractRequirement[];
  const existingKeySet = new Set(
    existingRequirements.map(
      (req) => `${req.role_key}:${req.contract_template_id}:${req.trigger_event}`,
    ),
  );

  const inserts: Array<Record<string, unknown>> = [];
  for (const requirement of requirements.filter(
    (entry) =>
      entry.is_active &&
      entry.is_required &&
      entry.trigger_event === triggerEvent &&
      roles.includes(entry.role_key),
  )) {
    const uniqueKey = `${requirement.role_key}:${requirement.contract_template_id}:${requirement.trigger_event}`;
    if (existingKeySet.has(uniqueKey)) {
      continue;
    }

    const baseTemplate = templateById.get(requirement.contract_template_id);
    const template =
      baseTemplate && baseTemplate.version_kind !== "amendment"
        ? currentTemplateByFamily.get(baseTemplate.family_key) ?? baseTemplate
        : baseTemplate;
    if (!template || !template.is_active) {
      continue;
    }

    const rendered = await renderContractTemplateForUser({
      userId,
      roleKey: requirement.role_key,
      template,
      variables: variablesByTemplateId.get(template.id) ?? [],
    });

    inserts.push({
      user_id: userId,
      role_key: requirement.role_key,
      contract_template_id: template.id,
      requirement_source: "role_requirement",
      rendered_title: rendered.renderedTitle,
      rendered_content: rendered.renderedContent,
      rendered_variables: rendered.renderedVariables,
      content_hash: rendered.contentHash,
      status: "pending",
      blocking: true,
      trigger_event: requirement.trigger_event,
    });
  }

  if (inserts.length > 0) {
    const { error } = await admin.from("user_contract_requirements").insert(inserts);
    if (error) {
      throw new Error(error.message);
    }
  }

  const { data, error } = await admin
    .from("user_contract_requirements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as UserContractRequirement[];
}

export async function getPendingUserContractRequirements(
  userId: string,
  triggerEvent: "signup" | "post_login" | "before_role_activation" | "before_payout" = "post_login",
) {
  const all = await ensureUserContractRequirements(userId, triggerEvent);
  return all.filter(
    (requirement) =>
      requirement.status === "pending" &&
      requirement.blocking &&
      requirement.trigger_event === triggerEvent,
  );
}

export async function getPendingContractDestination(userId: string, nextPath?: string) {
  let pending: UserContractRequirement[];
  try {
    pending = await getPendingUserContractRequirements(userId, "post_login");
  } catch (error) {
    if (!isTransientContractLookupError(error)) {
      throw error;
    }

    console.error(
      "[contract-orchestration] Contract lookup failed during portal routing; continuing without redirect.",
      error,
    );
    return null;
  }

  if (pending.length === 0) return null;
  return nextPath
    ? `/contracts/pending?next=${encodeURIComponent(nextPath)}`
    : "/contracts/pending";
}

export async function activateContractAmendmentRollout(params: {
  rolloutId: string;
  adminUserId: string;
}) {
  const admin = createAdminClient();
  const { data: rollout, error: rolloutError } = await admin
    .from("contract_amendment_rollouts")
    .select("*")
    .eq("id", params.rolloutId)
    .single();

  if (rolloutError || !rollout) {
    throw new Error(rolloutError?.message ?? "Amendment rollout not found");
  }

  const { data: template, error: templateError } = await admin
    .from("contract_templates")
    .select("*")
    .eq("id", rollout.amendment_template_id)
    .single();

  if (templateError || !template) {
    throw new Error(templateError?.message ?? "Amendment template not found");
  }

  if (template.version_kind !== "amendment") {
    throw new Error("Only amendment templates can be activated as amendment rollouts");
  }

  const targetRoles = Array.isArray(rollout.target_roles)
    ? rollout.target_roles.map((value: unknown) => String(value))
    : [];

  const userRolePairs = (
    await Promise.all(
      targetRoles.map(async (roleKey) => {
        const userIds = await listUserIdsForRole(roleKey);
        return userIds.map((userId) => ({ userId, roleKey }));
      }),
    )
  ).flat();

  const templateVariables = (await listContractVariables()).filter(
    (variable) => variable.template_id === template.id,
  );
  const inserts: Array<Record<string, unknown>> = [];

  for (const pair of userRolePairs) {
    const existingAccepted = await findLatestAcceptedRequirementForFamily({
      userId: pair.userId,
      roleKey: pair.roleKey,
      familyKey: template.family_key,
    });
    const rendered = await renderContractTemplateForUser({
      userId: pair.userId,
      roleKey: pair.roleKey,
      template: template as ContractTemplate,
      variables: templateVariables,
    });

    inserts.push({
      user_id: pair.userId,
      role_key: pair.roleKey,
      contract_template_id: template.id,
      requirement_source: "amendment_rollout",
      rendered_title: rendered.renderedTitle,
      rendered_content: rendered.renderedContent,
      rendered_variables: rendered.renderedVariables,
      content_hash: rendered.contentHash,
      status: "pending",
      blocking: true,
      trigger_event: "post_login",
      rollout_id: rollout.id,
      upgrades_prior_requirement_id: existingAccepted?.id ?? null,
    });
  }

  if (inserts.length > 0) {
    const { error: insertError } = await admin
      .from("user_contract_requirements")
      .upsert(inserts, {
        onConflict: "user_id,role_key,contract_template_id,trigger_event",
        ignoreDuplicates: false,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { error: updateError } = await admin
    .from("contract_amendment_rollouts")
    .update({
      rollout_state: "active",
      activated_at: new Date().toISOString(),
      activated_by: params.adminUserId,
      paused_at: null,
      superseded_at: null,
      affected_user_count: userRolePairs.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rollout.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    rolloutId: rollout.id,
    affectedUserCount: userRolePairs.length,
  };
}

export async function updateContractAmendmentRolloutState(params: {
  rolloutId: string;
  state: "paused" | "superseded";
}) {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    rollout_state: params.state,
    updated_at: new Date().toISOString(),
  };

  if (params.state === "paused") {
    updates.paused_at = new Date().toISOString();
  }
  if (params.state === "superseded") {
    updates.superseded_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("contract_amendment_rollouts")
    .update(updates)
    .eq("id", params.rolloutId);

  if (error) {
    throw new Error(error.message);
  }

  if (params.state === "superseded") {
    const { error: requirementError } = await admin
      .from("user_contract_requirements")
      .update({
        status: "superseded",
        updated_at: new Date().toISOString(),
      })
      .eq("rollout_id", params.rolloutId)
      .eq("status", "pending");
    if (requirementError) {
      throw new Error(requirementError.message);
    }
  }
}

export async function assertRoleContractsSatisfied(params: {
  userId: string;
  roleKey: string;
  triggerEvent?: "signup" | "post_login" | "before_role_activation" | "before_payout";
}) {
  const admin = createAdminClient();
  const triggerEvent = params.triggerEvent ?? "before_role_activation";
  const all = await ensureUserContractRequirements(params.userId, triggerEvent);
  const pending = all.filter(
    (requirement) =>
      requirement.role_key === params.roleKey &&
      requirement.status === "pending" &&
      requirement.blocking &&
      requirement.trigger_event === triggerEvent,
  );

  if (pending.length > 0) {
    throw new Error(`Missing required contracts for role ${params.roleKey}`);
  }

  return true;
}

export async function acceptUserContractRequirement(params: {
  requirementId: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  signatureName?: string | null;
}) {
  const admin = createAdminClient();
  const { data: requirement, error: requirementError } = await admin
    .from("user_contract_requirements")
    .select("*")
    .eq("id", params.requirementId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (requirementError || !requirement) {
    throw new Error(requirementError?.message ?? "Contract requirement not found");
  }
  if (requirement.status !== "pending") {
    throw new Error("This contract requirement is no longer pending");
  }

  const { data: template, error: templateError } = await admin
    .from("contract_templates")
    .select("*")
    .eq("id", requirement.contract_template_id)
    .single();

  if (templateError || !template) {
    throw new Error(templateError?.message ?? "Contract template not found");
  }

  let acceptanceId: string | null = null;
  if (template.legacy_document_type) {
    const { data: legalDocument } = await admin
      .from("legal_documents")
      .select("id, version, document_type")
      .eq("document_type", template.legacy_document_type)
      .eq("version", template.version)
      .maybeSingle();

    if (legalDocument) {
      const { data: acceptance, error: acceptanceError } = await admin
        .from("legal_acceptances")
        .upsert(
          {
            user_id: params.userId,
            document_id: legalDocument.id,
            document_type: legalDocument.document_type,
            document_version: legalDocument.version,
            accepted_at: new Date().toISOString(),
            ip_address: params.ipAddress,
            user_agent: params.userAgent,
          },
          { onConflict: "user_id,document_id" },
        )
        .select("id");

      if (acceptanceError) {
        throw new Error(acceptanceError.message);
      }
      acceptanceId = Array.isArray(acceptance)
        ? acceptance[0]?.id ?? null
        : ((acceptance as { id?: string } | null)?.id ?? null);
    }
  }

  let artifactId: string | null = null;
  if (acceptanceId) {
    const artifact = await ensureSignedAgreementArtifactForAcceptance(acceptanceId);
    artifactId = artifact.id;
    await admin
      .from("signed_agreement_artifacts")
      .update({
        contract_template_id: template.id,
        role_key: requirement.role_key,
        title: requirement.rendered_title,
        content_snapshot: requirement.rendered_content,
        rendered_variables: requirement.rendered_variables,
        content_hash: requirement.content_hash,
        signer_name: params.signatureName ?? null,
      })
      .eq("id", artifact.id);
  }

  const { error: updateError } = await admin
    .from("user_contract_requirements")
    .update({
      status: "accepted",
      accepted_artifact_id: artifactId,
      fulfilled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requirement.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    requirementId: requirement.id,
    artifact: artifactId ? await getSignedAgreementArtifact(artifactId) : null,
  };
}

export async function getContractStatusForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const pending = await getPendingUserContractRequirements(user.id, "post_login");
  const roles = await resolveUserRoleKeys(user.id);
  return { user, roles, pending };
}
