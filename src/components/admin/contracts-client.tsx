"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  ContractTemplate,
  ContractTemplateVariable,
  RoleContractRequirement,
} from "@/lib/contract-orchestration";

type EditableVariable = Omit<ContractTemplateVariable, "id" | "template_id"> & {
  localId: string;
};

type EditableRequirement = Omit<RoleContractRequirement, "id" | "contract_template_id"> & {
  localId: string;
};

const ROLE_OPTIONS = [
  "client",
  "community",
  "mystery_school",
  "diviner",
  "trainee",
  "advocate",
] as const;

const TRIGGER_OPTIONS = ["post_login", "before_role_activation", "before_payout", "signup"] as const;
const VERSION_KIND_OPTIONS = ["base", "amendment", "consolidated"] as const;
const APPLICABILITY_OPTIONS = ["all_users", "existing_users_snapshot", "future_users_only"] as const;

function newVariable(): EditableVariable {
  return {
    localId: crypto.randomUUID(),
    variable_key: "",
    label: "",
    source_type: "system",
    default_value: "",
    is_required: true,
    help_text: "",
    sort_order: 10,
  };
}

function newRequirement(): EditableRequirement {
  return {
    localId: crypto.randomUUID(),
    role_key: "client",
    is_required: true,
    trigger_event: "post_login",
    priority: 10,
    is_active: true,
  };
}

export function ContractsClient({
  initialTemplates,
  initialVariables,
  initialRequirements,
}: {
  initialTemplates: ContractTemplate[];
  initialVariables: ContractTemplateVariable[];
  initialRequirements: RoleContractRequirement[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [allVariables, setAllVariables] = useState(initialVariables);
  const [allRequirements, setAllRequirements] = useState(initialRequirements);
  const [selectedId, setSelectedId] = useState<string | null>(initialTemplates[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const selectedTemplate = templates.find((template) => template.id === selectedId) ?? null;

  const selectedVariables = useMemo(() => {
    if (!selectedId) return [newVariable()];
    const matches = allVariables
      .filter((variable) => variable.template_id === selectedId)
      .map((variable) => ({ ...variable, localId: variable.id }));
    return matches.length > 0 ? matches : [newVariable()];
  }, [allVariables, selectedId]);

  const selectedRequirements = useMemo(() => {
    if (!selectedId) return [newRequirement()];
    const matches = allRequirements
      .filter((requirement) => requirement.contract_template_id === selectedId)
      .map((requirement) => ({ ...requirement, localId: requirement.id }));
    return matches.length > 0 ? matches : [newRequirement()];
  }, [allRequirements, selectedId]);

  const [templateDraft, setTemplateDraft] = useState<ContractTemplate | null>(selectedTemplate);
  const [variableDrafts, setVariableDrafts] = useState<EditableVariable[]>(selectedVariables);
  const [requirementDrafts, setRequirementDrafts] = useState<EditableRequirement[]>(selectedRequirements);

  useEffect(() => {
    setTemplateDraft(selectedTemplate);
    setVariableDrafts(selectedVariables);
    setRequirementDrafts(selectedRequirements);
  }, [selectedTemplate, selectedVariables, selectedRequirements]);

  async function refreshData(preferredTemplateId?: string | null) {
    const res = await fetch("/api/admin/contracts", {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      templates?: ContractTemplate[];
      variables?: ContractTemplateVariable[];
      requirements?: RoleContractRequirement[];
    };
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to refresh contract data");
    }

    const nextTemplates = data.templates ?? [];
    const nextVariables = data.variables ?? [];
    const nextRequirements = data.requirements ?? [];
    const nextSelectedId =
      preferredTemplateId && nextTemplates.some((template) => template.id === preferredTemplateId)
        ? preferredTemplateId
        : nextTemplates[0]?.id ?? null;

    setTemplates(nextTemplates);
    setAllVariables(nextVariables);
    setAllRequirements(nextRequirements);
    setSelectedId(nextSelectedId);
  }

  function selectTemplate(templateId: string) {
    setSelectedId(templateId);
    const template = templates.find((entry) => entry.id === templateId) ?? null;
    setTemplateDraft(template);
    const nextVariables = allVariables
      .filter((variable) => variable.template_id === templateId)
      .map((variable) => ({ ...variable, localId: variable.id }));
    setVariableDrafts(nextVariables.length > 0 ? nextVariables : [newVariable()]);
    const nextRequirements = allRequirements
      .filter((requirement) => requirement.contract_template_id === templateId)
      .map((requirement) => ({ ...requirement, localId: requirement.id }));
    setRequirementDrafts(nextRequirements.length > 0 ? nextRequirements : [newRequirement()]);
  }

  function startNewTemplate() {
    setSelectedId(null);
    setTemplateDraft({
      id: "",
      contract_key: "",
      title: "",
      role_scope: [],
      template_body: "",
      summary_text: "",
      version: "1.0",
      effective_date: new Date().toISOString().slice(0, 10),
      is_active: true,
      legacy_document_type: null,
      family_key: "",
      version_kind: "base",
      amends_template_id: null,
      applicability_mode: "all_users",
      is_current_consolidated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setVariableDrafts([newVariable()]);
    setRequirementDrafts([newRequirement()]);
  }

  async function saveTemplate() {
    if (!templateDraft) return;
    setSaving(true);
    try {
      const payload = {
        template: templateDraft,
        variables: variableDrafts,
        requirements: requirementDrafts,
      };
      const res = await fetch("/api/admin/contracts", {
        method: templateDraft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; template?: ContractTemplate };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save contract template");
      }

      if (data.template) {
        await refreshData(data.template.id);
      } else if (templateDraft.id) {
        await refreshData(templateDraft.id);
      } else {
        await refreshData(null);
      }
      toast.success(templateDraft.id ? "Contract template updated" : "Contract template created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Manage contract templates, dynamic variables, and role assignments.
          </p>
        </div>
        <Button onClick={startNewTemplate}>New Contract</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer"
                    onClick={() => selectTemplate(template.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{template.contract_key}</div>
                      <div className="text-xs text-muted-foreground">{template.title}</div>
                    </TableCell>
                    <TableCell>{template.version}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {templateDraft ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-key">Contract Key</Label>
                    <Input
                      id="contract-key"
                      value={templateDraft.contract_key}
                      onChange={(event) =>
                        setTemplateDraft({ ...templateDraft, contract_key: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-title">Title</Label>
                    <Input
                      id="contract-title"
                      value={templateDraft.title}
                      onChange={(event) =>
                        setTemplateDraft({ ...templateDraft, title: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-version">Version</Label>
                    <Input
                      id="contract-version"
                      value={templateDraft.version}
                      onChange={(event) =>
                        setTemplateDraft({ ...templateDraft, version: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-date">Effective Date</Label>
                    <Input
                      id="contract-date"
                      type="date"
                      value={templateDraft.effective_date}
                      onChange={(event) =>
                        setTemplateDraft({ ...templateDraft, effective_date: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="legacy-document-type">Legacy Document Type</Label>
                    <Input
                      id="legacy-document-type"
                      value={templateDraft.legacy_document_type ?? ""}
                      onChange={(event) =>
                        setTemplateDraft({
                          ...templateDraft,
                          legacy_document_type: event.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="family-key">Family Key</Label>
                    <Input
                      id="family-key"
                      value={templateDraft.family_key}
                      onChange={(event) =>
                        setTemplateDraft({ ...templateDraft, family_key: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="version-kind">Version Kind</Label>
                    <Select
                      value={templateDraft.version_kind}
                      onValueChange={(value) =>
                        setTemplateDraft({
                          ...templateDraft,
                          version_kind: value as ContractTemplate["version_kind"],
                        })
                      }
                    >
                      <SelectTrigger id="version-kind" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {VERSION_KIND_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="applicability-mode">Applicability</Label>
                    <Select
                      value={templateDraft.applicability_mode}
                      onValueChange={(value) =>
                        setTemplateDraft({
                          ...templateDraft,
                          applicability_mode: value as ContractTemplate["applicability_mode"],
                        })
                      }
                    >
                      <SelectTrigger id="applicability-mode" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {APPLICABILITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amends-template-id">Amends Template Id</Label>
                    <Input
                      id="amends-template-id"
                      value={templateDraft.amends_template_id ?? ""}
                      onChange={(event) =>
                        setTemplateDraft({
                          ...templateDraft,
                          amends_template_id: event.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role Scope</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((roleKey) => {
                      const selected = templateDraft.role_scope.includes(roleKey);
                      return (
                        <Button
                          key={roleKey}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setTemplateDraft({
                              ...templateDraft,
                              role_scope: selected
                                ? templateDraft.role_scope.filter((value) => value !== roleKey)
                                : [...templateDraft.role_scope, roleKey],
                            })
                          }
                        >
                          {roleKey}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="current-consolidated">Current Consolidated Path</Label>
                  <Select
                    value={templateDraft.is_current_consolidated ? "yes" : "no"}
                    onValueChange={(value) =>
                      setTemplateDraft({
                        ...templateDraft,
                        is_current_consolidated: value === "yes",
                      })
                    }
                  >
                    <SelectTrigger id="current-consolidated" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="yes">yes</SelectItem>
                      <SelectItem value="no">no</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-summary">Summary</Label>
                  <Textarea
                    id="contract-summary"
                    rows={2}
                    value={templateDraft.summary_text ?? ""}
                    onChange={(event) =>
                      setTemplateDraft({ ...templateDraft, summary_text: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract-body">Template Body</Label>
                  <Textarea
                    id="contract-body"
                    rows={14}
                    value={templateDraft.template_body}
                    onChange={(event) =>
                      setTemplateDraft({ ...templateDraft, template_body: event.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Variables</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setVariableDrafts((current) => [...current, newVariable()])}>
                  Add Variable
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {variableDrafts.map((variable, index) => (
                  <div key={variable.localId} className="grid gap-3 rounded-lg border p-3 md:grid-cols-5">
                    <Input
                      value={variable.variable_key}
                      placeholder="variable_key"
                      onChange={(event) =>
                        setVariableDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, variable_key: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                    <Input
                      value={variable.label}
                      placeholder="Label"
                      onChange={(event) =>
                        setVariableDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, label: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                    <Select
                      value={variable.source_type}
                      onValueChange={(value) =>
                        setVariableDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  source_type: value as EditableVariable["source_type"],
                                }
                              : entry,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="system">system</SelectItem>
                        <SelectItem value="user_profile">user_profile</SelectItem>
                        <SelectItem value="role_profile">role_profile</SelectItem>
                        <SelectItem value="runtime">runtime</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={variable.default_value ?? ""}
                      placeholder="Default value"
                      onChange={(event) =>
                        setVariableDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, default_value: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setVariableDrafts((current) =>
                          current.length > 1 ? current.filter((entry) => entry.localId !== variable.localId) : current,
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Role Requirements</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setRequirementDrafts((current) => [...current, newRequirement()])}>
                  Add Requirement
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {requirementDrafts.map((requirement, index) => (
                  <div key={requirement.localId} className="grid gap-3 rounded-lg border p-3 md:grid-cols-5">
                    <Select
                      value={requirement.role_key}
                      onValueChange={(value) =>
                        setRequirementDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, role_key: value } : entry,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={requirement.trigger_event}
                      onValueChange={(value) =>
                        setRequirementDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  trigger_event: value as EditableRequirement["trigger_event"],
                                }
                              : entry,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {TRIGGER_OPTIONS.map((trigger) => (
                          <SelectItem key={trigger} value={trigger}>
                            {trigger}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={requirement.priority}
                      onChange={(event) =>
                        setRequirementDrafts((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, priority: Number(event.target.value) || 0 }
                              : entry,
                          ),
                        )
                      }
                    />
                    <Badge variant={requirement.is_required ? "default" : "secondary"}>
                      {requirement.is_required ? "Required" : "Optional"}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setRequirementDrafts((current) =>
                          current.length > 1
                            ? current.filter((entry) => entry.localId !== requirement.localId)
                            : current,
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveTemplate} disabled={saving}>
                {saving ? "Saving..." : "Save Contract"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
