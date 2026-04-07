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
  Plus,
  FileText,
  Pencil,
  Copy,
  Archive,
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

type BlogStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "unpublished"
  | "archived";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  excerpt: string | null;
  featured: boolean;
  hero: boolean;
  reading_time_minutes: number | null;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
  author: { id: string; name: string; avatar_url: string | null } | null;
  blog_post_categories: {
    category_id: string;
    blog_categories: { id: string; name: string; slug: string };
  }[];
  blog_post_tags: {
    tag_id: string;
    blog_tags: { id: string; name: string; slug: string };
  }[];
};

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_TABS: { value: BlogStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
];

const STATUS_CLASSES: Record<BlogStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  scheduled: "bg-purple-100 text-purple-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-orange-100 text-orange-700",
  archived: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<BlogStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  unpublished: "Unpublished",
  archived: "Archived",
};

function StatusBadge({ status }: { status: BlogStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function fmt(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface BlogTableClientProps {
  posts: BlogPost[];
  total: number;
  searchParams: {
    q: string;
    status: string;
    page: string;
    pageSize: string;
    sortBy: string;
    sortDir: string;
  };
}

// ─── Client component ────────────────────────────────────────────────────────

export function BlogTableClient({
  posts,
  total,
  searchParams,
}: BlogTableClientProps) {
  const router = useRouter();
  const {
    pushParams,
    currentPage,
    currentSort,
    currentDir,
    currentQ,
    isPending,
  } = useAdminTableParams({ sort: "updated_at", dir: "desc" });

  const pageSize = parseInt(searchParams.pageSize, 10) || 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeStatus = searchParams.status || "all";

  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  const hasActiveFilters =
    currentQ !== "" || activeStatus !== "all";

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleStatusChange(status: string) {
    pushParams({ status: status === "all" ? "" : status });
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
    pushParams({ q: "", status: "", page: "1", sortBy: "", sortDir: "" });
  }

  async function handleDuplicate(post: BlogPost) {
    setDuplicating(post.id);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${post.title} (Copy)`,
          excerpt: post.excerpt,
          status: "draft",
          author_id: post.author?.id ?? null,
        }),
      });
      if (res.ok) {
        toast.success("Post duplicated as draft");
        router.refresh();
      } else {
        toast.error("Failed to duplicate post");
      }
    } catch {
      toast.error("Failed to duplicate post");
    } finally {
      setDuplicating(null);
    }
  }

  async function handleArchive(post: BlogPost) {
    if (
      !confirm(
        `Archive "${post.title}"? It will be removed from the public site.`,
      )
    )
      return;
    setArchiving(post.id);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Post archived");
        router.refresh();
      } else {
        toast.error("Failed to archive post");
      }
    } catch {
      toast.error("Failed to archive post");
    } finally {
      setArchiving(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            {total} post{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/blog/new">
            <Plus className="mr-1.5 size-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
              activeStatus === tab.value
                ? "border-b-2 border-amber-500 text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
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
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <FileText className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No posts found.</p>
              <Button asChild size="sm">
                <Link href="/admin/blog/new">
                  <Plus className="mr-1.5 size-4" /> Create your first post
                </Link>
              </Button>
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
                    <TableHead>Author</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>
                      <SortHeader
                        label="Status"
                        column="status"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>Read time</TableHead>
                    <TableHead>
                      <SortHeader
                        label="Published"
                        column="published_at"
                        currentSort={currentSort}
                        currentDir={currentDir}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow
                      key={post.id}
                      className={isPending ? "opacity-60" : ""}
                    >
                      <TableCell className="max-w-[240px]">
                        <div>
                          <p className="font-medium truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            /blog/{post.slug}
                          </p>
                          <div className="flex gap-1 mt-0.5">
                            {post.featured && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                Featured
                              </Badge>
                            )}
                            {post.hero && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                Hero
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.author?.name ?? "\u2014"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.blog_post_categories.map((pc) => (
                            <Badge
                              key={pc.category_id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {pc.blog_categories.name}
                            </Badge>
                          ))}
                          {post.blog_post_categories.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              {"\u2014"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.reading_time_minutes
                          ? `${post.reading_time_minutes} min`
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.status === "scheduled" && post.scheduled_at
                          ? `Scheduled ${fmt(post.scheduled_at)}`
                          : fmt(post.published_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Post actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/blog/${post.id}`}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(post)}
                              disabled={duplicating === post.id}
                            >
                              <Copy className="mr-2 size-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {post.status !== "archived" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleArchive(post)}
                                  disabled={archiving === post.id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Archive className="mr-2 size-4" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
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
