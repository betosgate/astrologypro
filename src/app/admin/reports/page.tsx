"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

type Report = {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  report_type: string | null;
  description: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = ["pending", "under_review", "resolved", "dismissed"];

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  under_review: "secondary",
  resolved: "default",
  dismissed: "destructive",
};

export default function AdminReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<Report | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/admin/reports?${params}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterStatus, filterFrom, filterTo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openPreview(id: string) {
    const res = await fetch(`/api/admin/reports/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setPreviewItem(data);
    setEditStatus(data.status ?? "pending");
    setEditNotes(data.admin_notes ?? "");
  }

  async function handleSaveNotes() {
    if (!previewItem) return;
    setSaving(true);
    const res = await fetch(`/api/admin/reports/${previewItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus, admin_notes: editNotes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPreviewItem(updated);
      setItems((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">{items.length} reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
        {(filterStatus || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}>
            Clear
          </Button>
        )}
      </div>

      {previewItem && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">Report Detail</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewItem(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className="font-medium">ID: </span>{previewItem.id}</div>
              <div><span className="font-medium">Type: </span>{previewItem.report_type ?? "—"}</div>
              <div><span className="font-medium">Reporter: </span>{previewItem.reporter_id ?? "—"}</div>
              <div><span className="font-medium">Reported User: </span>{previewItem.reported_user_id ?? "—"}</div>
              <div><span className="font-medium">IP: </span>{previewItem.ip_address ?? "—"}</div>
              <div><span className="font-medium">Created: </span>{new Date(previewItem.created_at).toLocaleString()}</div>
              <div className="sm:col-span-2"><span className="font-medium">Description: </span>{previewItem.description ?? "—"}</div>
              <div className="sm:col-span-2 text-xs text-muted-foreground break-all"><span className="font-medium">User Agent: </span>{previewItem.user_agent ?? "—"}</div>
            </div>
            <div className="space-y-2 border-t pt-3">
              <Label>Status</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Label>Admin Notes</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Add notes for this report…" />
              <Button size="sm" onClick={handleSaveNotes} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No reports found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{report.report_type ?? "Unknown type"}</span>
                      <Badge variant={STATUS_COLORS[report.status] ?? "outline"}>{report.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{report.description ?? "No description"}</p>
                    <p className="text-xs text-muted-foreground">{report.ip_address ?? "—"} · {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openPreview(report.id)}>
                    <Eye className="size-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
