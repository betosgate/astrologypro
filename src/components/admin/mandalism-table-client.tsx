"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
} from "lucide-react";
import {
  SortHeader,
  AdminPagination,
  AdminTableSearch,
  AdminResetButton,
  useAdminTableParams,
} from "./admin-table-parts";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MandalismContent = {
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

export type MandalismStats = {
  total: number;
  published: number;
  draft: number;
  counts: Record<string, number>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

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

const CONTENT_TYPE_KEYS = [
  "live_stream",
  "video",
  "document",
  "youtube",
  "announcement",
] as const;

function fmt(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface MandalismTableClientProps {
  items: MandalismContent[];
  total: number;
  stats: MandalismStats;
  searchParams: {
    q: string;
    type: string;
    status: string;
    access: string;
    page: string;
    pageSize: string;
    sortBy: string;
    sortDir: string;
  };
}

// ─── Client component ────────────────────────────────────────────────────────

export function MandalismTableClient({
  items,
  total,
  stats,
  searchParams,
}: MandalismTableClientProps) {
  const router = useRouter();
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "created_at", dir: "desc" });

  const pageSize = parseInt(searchParams.pageSize, 10) || 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeType = searchParams.type || "all";
  const activeStatus = searchParams.status || "all";
  const activeAccess = searchParams.access || "all";

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasActiveFilters =
    currentQ !== "" ||
    activeType !== "all" ||
    activeStatus !== "all" ||
    activeAccess !== "all";

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleTypeChange(type: string) {
    pushParams({ type: type === "all" ? "" : type });
  }

  function handleStatusChange(status: string) {
    pushParams({ status: status === "all" ? "" : status });
  }

  function handleAccessChange(access: string) {
    pushParams({ access: access === "all" ? "" : access });
  }

  function handleSearch(value: string) {
    pushParams({ q: value });
  }

  function handleSort(column: string) {
    if (currentSort === column) {
      pushParams({ sortDir: currentDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sortBy: column, sortDir: "desc" });
    }
  }

  function handlePageChange(p: number) {
    pushParams({ page: String(p) });
  }

  function handlePageSizeChange(size: string) {
    pushParams({ pageSize: size, page: "1" });
  }

  function handleReset() {
    pushParams({
      q: "",
      type: "",
      status: "",
      access: "",
      page: "1",
      sortBy: "",
      sortDir: "",
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/mandalism/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Content deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete content");
      }
    } catch {
      toast.error("Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mandalism Content
          </h1>
          <p className="text-muted-foreground">
            Manage Perennial Mandalism content library
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/mandalism/add">
              <Plus className="mr-1.5 size-4" />
              Add Member
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/mandalism/new">
              <Plus className="mr-1.5 size-4" />
              New Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
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
            <p className="text-2xl font-bold text-green-600">
              {stats.published}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Draft</p>
            <p className="text-2xl font-bold">{stats.draft}</p>
          </CardContent>
        </Card>
        {CONTENT_TYPE_KEYS.map((t) => (
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

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {/* Type pills */}
        <div className="flex flex-wrap gap-1">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeType === t.value
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
            type="button"
            onClick={() => handleStatusChange(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {s === "all"
              ? "All Status"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <div className="h-6 w-px bg-border self-center" />

        {/* Access pills */}
        {(["all", "free", "members"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => handleAccessChange(a)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeAccess === a
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {a === "all"
              ? "All Access"
              : a === "free"
                ? "Free"
                : "Members Only"}
          </button>
        ))}
      </div>

      {/* Search + Reset */}
      <div className="flex items-center gap-3 max-w-lg">
        <div className="flex-1">
          <AdminTableSearch
            defaultValue={currentQ}
            onSearch={handleSearch}
            placeholder="Search by title..."
          />
        </div>
        <AdminResetButton
          hasActiveFilters={hasActiveFilters}
          onReset={handleReset}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Content</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <FileText className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {total === 0 && !hasActiveFilters
                  ? "No content yet."
                  : "No content matches the current filters."}
              </p>
              {total === 0 && !hasActiveFilters && (
                <Button asChild size="sm">
                  <Link href="/admin/mandalism/new">
                    <Plus className="mr-1.5 size-4" />
                    Create your first piece of content
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeader
                        label="Title"
                        column="title"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeader
                        label="Type"
                        column="content_type"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeader
                        label="Access"
                        column="access_control"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeader
                        label="Priority"
                        column="priority"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeader
                        label="Status"
                        column="is_published"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortHeader
                        label="Created"
                        column="created_at"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={isPending ? "opacity-60" : ""}
                    >
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
                          <span>
                            {CONTENT_TYPE_LABELS[item.content_type] ??
                              item.content_type}
                          </span>
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
                          {item.access_control === "free"
                            ? "Free"
                            : "Members only"}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Content actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/mandalism/${item.id}/edit`}
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  disabled={deletingId === item.id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete content?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{item.title}</strong> will be
                                    permanently deleted. This action cannot be
                                    undone.
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isPending={isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
