"use client";

import { useState, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Edit2, Plus, Trash2, AlertCircle } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  effective_date: string;
  created_at: string;
}

interface LegalClientProps {
  documents: LegalDocument[];
  acceptanceCounts: Record<string, number>;
}

// ─── Tab config ──────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { value: "customer_terms", label: "Customer Terms" },
  { value: "diviner_agreement", label: "Diviner Agreement" },
  { value: "affiliate_agreement", label: "Affiliate Agreement" },
  { value: "telephony_consent", label: "Telephony Consent" },
  { value: "privacy_policy", label: "Privacy Policy" },
] as const;

// ─── Version increment ───────────────────────────────────────────────────────

function incrementVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length !== 2) return `${version}.1`;
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  if (isNaN(minor)) return `${major}.1`;
  return `${major}.${minor + 1}`;
}

// ─── Edit form state ─────────────────────────────────────────────────────────

interface EditForm {
  version: string;
  title: string;
  effective_date: string;
  content: string;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function LegalClient({ documents, acceptanceCounts }: LegalClientProps) {
  const [allDocs, setAllDocs] = useState<LegalDocument[]>(documents);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    version: "",
    title: "",
    effective_date: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegalDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const docsForType = useCallback(
    (type: string) => allDocs.filter((d) => d.document_type === type),
    [allDocs]
  );

  const activeDoc = useCallback(
    (type: string) => allDocs.find((d) => d.document_type === type && d.is_active) ?? null,
    [allDocs]
  );

  function startEdit(type: string) {
    const active = activeDoc(type);
    const nextVersion = active ? incrementVersion(active.version) : "1.0";
    setEditForm({
      version: nextVersion,
      title: active?.title ?? "",
      effective_date: new Date().toISOString().split("T")[0],
      content: active?.content ?? "",
    });
    setEditingType(type);
    setError(null);
  }

  function cancelEdit() {
    setEditingType(null);
    setError(null);
  }

  async function handleSave(type: string) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: type,
          version: editForm.version,
          title: editForm.title,
          content: editForm.content,
          effective_date: editForm.effective_date,
          activate_immediately: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.detail ?? "Failed to save document.");
        return;
      }
      // Refresh: deactivate all same type, add new active
      setAllDocs((prev) => {
        const updated = prev
          .map((d) => (d.document_type === type ? { ...d, is_active: false } : d))
          .concat({ ...json, is_active: true });
        return updated;
      });
      setEditingType(null);
      setSuccessMsg(`Version ${json.version} saved and activated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(doc: LegalDocument) {
    setActivating(doc.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/legal/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.detail ?? "Failed to activate.");
        return;
      }
      setAllDocs((prev) =>
        prev.map((d) => {
          if (d.document_type === doc.document_type) {
            return { ...d, is_active: d.id === doc.id };
          }
          return d;
        })
      );
      setSuccessMsg(`Version ${doc.version} is now active.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setActivating(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/legal/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.detail ?? "Failed to delete.");
        return;
      }
      setAllDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMsg("Document version deleted.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#f5f0e8" }}>
          Legal Documents
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#a89880" }}>
          Manage versioned legal documents. Each type supports one active version and full version history.
        </p>
      </div>

      {error && (
        <div
          className="mb-4 flex items-center gap-2 rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#ef4444", color: "#fca5a5", backgroundColor: "rgba(239,68,68,0.08)" }}
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div
          className="mb-4 flex items-center gap-2 rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#22c55e", color: "#86efac", backgroundColor: "rgba(34,197,94,0.08)" }}
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <Tabs defaultValue={TAB_CONFIG[0].value}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto bg-transparent p-0">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map((tab) => {
          const typeDocs = docsForType(tab.value);
          const active = activeDoc(tab.value);
          const isEditing = editingType === tab.value;
          const activeAcceptances = active ? (acceptanceCounts[active.id] ?? 0) : 0;

          return (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <div className="space-y-6">
                {/* Active version card */}
                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.04)" }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold" style={{ color: "#f5f0e8" }}>
                        {active?.title ?? "No active document"}
                      </h2>
                      {active && (
                        <Badge
                          className="text-xs"
                          style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}
                        >
                          Active v{active.version}
                        </Badge>
                      )}
                    </div>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(tab.value)}
                        className="gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        New Version
                      </Button>
                    )}
                  </div>

                  {active && (
                    <p className="mb-3 text-xs" style={{ color: "#a89880" }}>
                      Effective{" "}
                      {new Date(active.effective_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      &middot; {activeAcceptances} user{activeAcceptances !== 1 ? "s" : ""} accepted
                    </p>
                  )}

                  {/* Content viewer */}
                  {!isEditing && active && (
                    <Textarea
                      readOnly
                      value={active.content}
                      rows={10}
                      className="resize-none font-mono text-xs"
                      style={{ backgroundColor: "rgba(6,8,15,0.6)", color: "#f5f0e8", borderColor: "rgba(201,168,76,0.15)" }}
                    />
                  )}

                  {/* Edit form */}
                  {isEditing && (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs" style={{ color: "#a89880" }}>Version</Label>
                          <Input
                            value={editForm.version}
                            onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
                            placeholder="e.g. 1.1"
                            style={{ backgroundColor: "rgba(6,8,15,0.6)", color: "#f5f0e8", borderColor: "rgba(201,168,76,0.2)" }}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs" style={{ color: "#a89880" }}>Title</Label>
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            style={{ backgroundColor: "rgba(6,8,15,0.6)", color: "#f5f0e8", borderColor: "rgba(201,168,76,0.2)" }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs" style={{ color: "#a89880" }}>Effective Date</Label>
                        <Input
                          type="date"
                          value={editForm.effective_date}
                          onChange={(e) => setEditForm((f) => ({ ...f, effective_date: e.target.value }))}
                          style={{ backgroundColor: "rgba(6,8,15,0.6)", color: "#f5f0e8", borderColor: "rgba(201,168,76,0.2)" }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs" style={{ color: "#a89880" }}>Content (Markdown/Plain text)</Label>
                        <Textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                          rows={14}
                          className="resize-y font-mono text-xs"
                          style={{ backgroundColor: "rgba(6,8,15,0.6)", color: "#f5f0e8", borderColor: "rgba(201,168,76,0.2)" }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(tab.value)}
                          disabled={saving}
                          style={{ backgroundColor: "#c9a84c", color: "#06080f" }}
                        >
                          {saving ? "Saving…" : "Save as New Version & Activate"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Version history */}
                {typeDocs.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: "#a89880" }}>
                      Version History
                    </h3>
                    <div className="rounded-lg border" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
                      <Table>
                        <TableHeader>
                          <TableRow style={{ borderColor: "rgba(201,168,76,0.15)" }}>
                            <TableHead style={{ color: "#a89880" }}>Version</TableHead>
                            <TableHead style={{ color: "#a89880" }}>Effective Date</TableHead>
                            <TableHead style={{ color: "#a89880" }}>Status</TableHead>
                            <TableHead style={{ color: "#a89880" }}>Acceptances</TableHead>
                            <TableHead className="w-28" style={{ color: "#a89880" }}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {typeDocs.map((doc) => {
                            const accCount = acceptanceCounts[doc.id] ?? 0;
                            return (
                              <TableRow key={doc.id} style={{ borderColor: "rgba(201,168,76,0.08)" }}>
                                <TableCell className="font-mono text-sm" style={{ color: "#f5f0e8" }}>
                                  {doc.version}
                                </TableCell>
                                <TableCell className="text-sm" style={{ color: "#f5f0e8" }}>
                                  {new Date(doc.effective_date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell>
                                  {doc.is_active ? (
                                    <Badge
                                      className="text-xs"
                                      style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}
                                    >
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge
                                      className="text-xs"
                                      style={{ backgroundColor: "rgba(161,161,170,0.1)", color: "#a1a1aa", border: "1px solid rgba(161,161,170,0.2)" }}
                                    >
                                      Inactive
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm" style={{ color: "#a89880" }}>
                                  {accCount}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    {!doc.is_active && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs"
                                        disabled={activating === doc.id}
                                        onClick={() => handleActivate(doc)}
                                      >
                                        {activating === doc.id ? "…" : "Activate"}
                                      </Button>
                                    )}
                                    {!doc.is_active && accCount === 0 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                        onClick={() => setDeleteTarget(doc)}
                                      >
                                        <Trash2 className="size-3.5" />
                                        <span className="sr-only">Delete version {doc.version}</span>
                                      </Button>
                                    )}
                                    {doc.is_active && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        style={{ color: "#c9a84c" }}
                                        onClick={() => startEdit(tab.value)}
                                        title="Create new version from this"
                                      >
                                        <Edit2 className="size-3.5" />
                                        <span className="sr-only">Edit active version</span>
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {typeDocs.length === 0 && (
                  <div
                    className="rounded-lg border p-8 text-center text-sm"
                    style={{ borderColor: "rgba(201,168,76,0.15)", color: "#a89880" }}
                  >
                    No documents yet for this type.{" "}
                    <button
                      className="underline"
                      style={{ color: "#c9a84c" }}
                      onClick={() => startEdit(tab.value)}
                    >
                      Create the first version
                    </button>
                    .
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent style={{ backgroundColor: "#0d1017", borderColor: "rgba(201,168,76,0.2)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#f5f0e8" }}>Delete version {deleteTarget?.version}?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#a89880" }}>
              This will permanently delete version {deleteTarget?.version} of{" "}
              {deleteTarget?.document_type?.replace(/_/g, " ")}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
