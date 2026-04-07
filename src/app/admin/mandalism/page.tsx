"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Radio,
  Video,
  FileText,
  PlayCircle,
  Megaphone,
  Pencil,
  Trash2,
  Plus,
  Search,
} from "lucide-react";

type MandalismContent = {
  id: string;
  title: string;
  content_type: string;
  access_control: string;
  is_published: boolean;
  priority: number | null;
  created_at: string;
  description: string | null;
  url: string | null;
  pdf_url: string | null;
  content_thumbnail_url: string | null;
  duration_label: string | null;
  start_at: string | null;
  end_at: string | null;
};

type SortOption = "newest" | "oldest" | "priority_desc" | "priority_asc";

const CONTENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "live_stream", label: "Live Stream" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
  { value: "youtube", label: "YouTube" },
  { value: "announcement", label: "Announcement" },
] as const;

const CONTENT_TYPE_LABELS: Record<string, string> = {
  live_stream: "Live Stream",
  video: "Video",
  document: "Document",
  youtube: "YouTube",
  announcement: "Announcement",
};

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  live_stream: <Radio className="size-3.5 text-red-500" />,
  video: <Video className="size-3.5 text-blue-500" />,
  document: <FileText className="size-3.5 text-orange-500" />,
  youtube: <PlayCircle className="size-3.5 text-red-600" />,
  announcement: <Megaphone className="size-3.5 text-purple-500" />,
};

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export default function AdminMandalismPage() {
  const [content, setContent] = useState<MandalismContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  async function loadContent() {
    setLoading(true);
    const res = await fetch("/api/admin/mandalism");
    if (res.ok) setContent(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadContent();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/mandalism/${id}`, { method: "DELETE" });
    if (res.ok) {
      setContent((prev) => prev.filter((item) => item.id !== id));
    }
    setDeletingId(null);
  }

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let published = 0;
    let draft = 0;
    for (const item of content) {
      counts[item.content_type] = (counts[item.content_type] ?? 0) + 1;
      if (item.is_published) published++;
      else draft++;
    }
    return { counts, published, draft, total: content.length };
  }, [content]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...content];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) => item.title.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      list = list.filter((item) => item.content_type === typeFilter);
    }
    if (statusFilter === "published") {
      list = list.filter((item) => item.is_published);
    } else if (statusFilter === "draft") {
      list = list.filter((item) => !item.is_published);
    }
    if (accessFilter === "free") {
      list = list.filter((item) => item.access_control === "free");
    } else if (accessFilter === "members") {
      list = list.filter((item) => item.access_control === "members");
    }

    list.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "priority_desc")
        return (b.priority ?? 0) - (a.priority ?? 0);
      if (sortBy === "priority_asc")
        return (a.priority ?? 0) - (b.priority ?? 0);
      return 0;
    });

    return list;
  }, [content, search, typeFilter, statusFilter, accessFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mandalism Content</h1>
          <p className="text-muted-foreground">Manage Perennial Mandalism content library</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/mandalism/add">
              <Plus className="mr-2 size-4" />
              Add Member
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/mandalism/new">
              <Plus className="mr-2 size-4" />
              New Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-green-600">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </CardContent>
          </Card>
          {["live_stream", "video", "document", "youtube", "announcement"].map((t) => (
            <Card key={t}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {CONTENT_TYPE_ICONS[t]}
                  <span>{CONTENT_TYPE_LABELS[t]}</span>
                </div>
                <p className="text-2xl font-bold">{stats.counts[t] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + Sort row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority_desc">Priority high→low</option>
              <option value="priority_asc">Priority low→high</option>
            </select>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {/* Type pills */}
            <div className="flex flex-wrap gap-1">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    typeFilter === t.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {t.value !== "all" && CONTENT_TYPE_ICONS[t.value]}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-border self-center" />

            {/* Status pills */}
            {(["all", "published", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}

            <div className="h-6 w-px bg-border self-center" />

            {/* Access pills */}
            {(["all", "free", "members"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAccessFilter(a)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  accessFilter === a
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {a === "all" ? "All Access" : a === "free" ? "Free" : "Members Only"}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-muted-foreground">
                {content.length === 0
                  ? "No content yet."
                  : "No content matches the current filters."}
              </p>
              {content.length === 0 && (
                <Button asChild>
                  <Link href="/admin/mandalism/new">
                    <Plus className="mr-2 size-4" />
                    Create your first piece of content
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        {item.content_thumbnail_url && (
                          <img
                            src={item.content_thumbnail_url}
                            alt=""
                            className="size-8 rounded object-cover shrink-0"
                          />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {CONTENT_TYPE_ICONS[item.content_type]}
                        <span>{CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.access_control === "free"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        }
                      >
                        {item.access_control === "free" ? "Free" : "Members only"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.priority ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.is_published
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmt(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/mandalism/${item.id}/edit`}>
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              disabled={deletingId === item.id}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete content?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{item.title}</strong> will be permanently deleted. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(item.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Showing {filtered.length} of {content.length} items
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
