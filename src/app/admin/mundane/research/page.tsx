"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlaskConical, Plus, Loader2, ChevronRight, Search } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResearchProject = {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  status: string;
  entity_ids: string[];
  leader_ids: string[];
  created_at: string;
};

type EntityOption = { id: string; name: string; flag_emoji: string | null };

type ProjectForm = {
  title: string;
  description: string;
  entity_ids: string[];
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
};

const EMPTY_FORM: ProjectForm = { title: "", description: "", entity_ids: [] };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ResearchListPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  async function fetchProjects(p: number, replace: boolean, overrides?: { search?: string; status?: string }) {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    const s = overrides?.search ?? search;
    const st = overrides?.status ?? statusFilter;

    const params = new URLSearchParams({ page: String(p) });
    if (s) params.set("search", s);
    if (st) params.set("status", st);

    const res = await fetch(`/api/admin/mundane/research?${params}`);
    if (res.ok) {
      const json = await res.json();
      setProjects((prev) => replace ? json.projects : [...prev, ...json.projects]);
      setTotal(json.total);
      setHasMore(json.hasMore);
      setPage(p);
    }
    setLoading(false);
    setLoadingMore(false);
  }

  async function loadEntityOptions() {
    const res = await fetch("/api/admin/mundane/entities?page=1");
    if (res.ok) {
      const json = await res.json();
      setEntityOptions(
        (json.entities ?? []).map((e: { id: string; name: string; flag_emoji: string | null }) => ({
          id: e.id,
          name: e.name,
          flag_emoji: e.flag_emoji,
        }))
      );
    }
  }

  useEffect(() => {
    fetchProjects(1, true);
    loadEntityOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilter(key: "search" | "status", value: string) {
    if (key === "search") setSearch(value);
    if (key === "status") setStatusFilter(value);
    fetchProjects(1, true, { search, [key]: value });
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setSaving(true);
    setFormError("");

    const res = await fetch("/api/admin/mundane/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        entity_ids: form.entity_ids,
      }),
    });

    if (res.ok) {
      setDialogOpen(false);
      fetchProjects(1, true);
    } else {
      const json = await res.json();
      setFormError(json.detail ?? "Failed to save.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="size-6 text-violet-500" />
            Research Workspace
          </h1>
          <p className="text-muted-foreground">Manage mundane astrology research projects and notes.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane">Back to Hub</Link>
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 size-4" /> New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchProjects(1, true); }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => applyFilter("status", e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
        <Button size="sm" variant="outline" onClick={() => fetchProjects(1, true)}>
          Search
        </Button>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">{total} project{total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Project list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FlaskConical className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No research projects found</p>
            <p className="text-sm text-muted-foreground">Start a new research project to track your mundane analysis.</p>
            <Button size="sm" onClick={openAdd}><Plus className="mr-1.5 size-4" /> New Project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/mundane/research/${project.id}`}
              className="group rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate group-hover:underline">{project.title}</h3>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${STATUS_BADGE[project.status] ?? ""}`}
                >
                  {project.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {project.entity_ids.length} entit{project.entity_ids.length !== 1 ? "ies" : "y"}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(project.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={() => fetchProjects(page + 1, false)} disabled={loadingMore}>
            {loadingMore && <Loader2 className="mr-2 size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Research Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. US Election Cycle 2028 Analysis"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Research objectives and scope..."
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Linked Entity</label>
              <select
                value={form.entity_ids[0] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, entity_ids: e.target.value ? [e.target.value] : [] }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">-- No linked entity --</option>
                {entityOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.flag_emoji ? `${e.flag_emoji} ` : ""}{e.name}
                  </option>
                ))}
              </select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
