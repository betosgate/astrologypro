import { createAdminClient } from "@/lib/supabase/admin";

export type DashboardContentCategory =
  | "blog"
  | "announcement"
  | "calendar_event"
  | "system_video"
  | "youtube_video"
  | "document";

export type DashboardContentMode = "native" | "source_linked";

export type DashboardPublicationState =
  | "draft"
  | "scheduled"
  | "published"
  | "expired"
  | "archived";

export type DashboardAudienceScope =
  | "all_members"
  | "perennial_mandalism"
  | "mystery_school";

export interface DashboardContentItemRow {
  id: string;
  dashboard_scope: "perennial_mandalism";
  item_mode: DashboardContentMode;
  category: DashboardContentCategory;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  source_table: "blog_posts" | "calendar_events" | "mandalism_content" | null;
  source_id: string | null;
  publish_at: string;
  expire_at: string | null;
  is_active: boolean;
  is_pinned: boolean;
  manual_sort_weight: number;
  audience_scope: DashboardAudienceScope;
  publication_state: DashboardPublicationState;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardFeedItem {
  id: string;
  category: DashboardContentCategory;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  badgeLabel: string;
  publishAt: string;
  ctaLabel: string;
  ctaUrl: string;
  isPinned: boolean;
  isNew: boolean;
  sourceMetadata: Record<string, unknown>;
}

export interface DashboardContentSourceOption {
  id: string;
  label: string;
  category: Exclude<DashboardContentCategory, "announcement" | "youtube_video">;
  sourceTable: "blog_posts" | "calendar_events" | "mandalism_content";
  description: string | null;
}

export interface DashboardContentAdminFilters {
  category?: string;
  publicationState?: string;
  itemMode?: string;
}

export interface DashboardContentPayload {
  category: DashboardContentCategory;
  item_mode: DashboardContentMode;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  source_table?: "blog_posts" | "calendar_events" | "mandalism_content" | null;
  source_id?: string | null;
  publish_at?: string | null;
  expire_at?: string | null;
  is_active?: boolean;
  is_pinned?: boolean;
  manual_sort_weight?: number;
  audience_scope?: DashboardAudienceScope;
  publication_state?: DashboardPublicationState;
  metadata?: Record<string, unknown> | null;
}

const CATEGORY_LABELS: Record<DashboardContentCategory, string> = {
  blog: "Blog",
  announcement: "Announcement",
  calendar_event: "Event",
  system_video: "System Video",
  youtube_video: "YouTube",
  document: "Document",
};

const SOURCE_LINKED_CATEGORIES = new Set<DashboardContentCategory>([
  "blog",
  "calendar_event",
  "system_video",
  "document",
]);

function normalizePublicationState(
  publicationState: DashboardPublicationState | null | undefined,
  publishAt: string,
  expireAt: string | null | undefined,
) {
  const now = Date.now();
  const publishTimestamp = new Date(publishAt).getTime();
  const expireTimestamp = expireAt ? new Date(expireAt).getTime() : null;

  if (publicationState === "archived" || publicationState === "draft") {
    return publicationState;
  }
  if (expireTimestamp && expireTimestamp <= now) {
    return "expired";
  }
  if (publishTimestamp > now) {
    return "scheduled";
  }
  return "published";
}

export function validateDashboardContentPayload(
  payload: DashboardContentPayload,
): { ok: true; value: DashboardContentPayload } | { ok: false; error: string } {
  const title = payload.title?.trim();
  if (!title) {
    return { ok: false, error: "Title is required" };
  }

  if (payload.item_mode === "source_linked") {
    if (!SOURCE_LINKED_CATEGORIES.has(payload.category)) {
      return {
        ok: false,
        error: `${payload.category} does not support source-linked publishing`,
      };
    }
    if (!payload.source_table || !payload.source_id) {
      return { ok: false, error: "Linked items require a source record" };
    }
  }

  if (payload.item_mode === "native" && SOURCE_LINKED_CATEGORIES.has(payload.category)) {
    return {
      ok: false,
      error: `${payload.category} must use a source-linked record`,
    };
  }

  if (payload.category === "youtube_video") {
    const youtubeUrl = payload.cta_url ?? String(payload.metadata?.youtube_url ?? "");
    if (!youtubeUrl.trim()) {
      return { ok: false, error: "YouTube videos require a watch URL" };
    }
  }

  const publishAt = payload.publish_at ? new Date(payload.publish_at) : new Date();
  if (Number.isNaN(publishAt.getTime())) {
    return { ok: false, error: "Publish date is invalid" };
  }

  const expireAt = payload.expire_at ? new Date(payload.expire_at) : null;
  if (expireAt && Number.isNaN(expireAt.getTime())) {
    return { ok: false, error: "Expire date is invalid" };
  }
  if (expireAt && expireAt <= publishAt) {
    return { ok: false, error: "Expire date must be after publish date" };
  }

  return {
    ok: true,
    value: {
      ...payload,
      title,
      description: payload.description?.trim() || null,
      thumbnail_url: payload.thumbnail_url?.trim() || null,
      cta_label: payload.cta_label?.trim() || null,
      cta_url: payload.cta_url?.trim() || null,
      source_table: payload.item_mode === "source_linked" ? payload.source_table ?? null : null,
      source_id: payload.item_mode === "source_linked" ? payload.source_id ?? null : null,
      publish_at: publishAt.toISOString(),
      expire_at: expireAt?.toISOString() ?? null,
      is_active: payload.is_active ?? true,
      is_pinned: payload.is_pinned ?? false,
      manual_sort_weight: payload.manual_sort_weight ?? 0,
      audience_scope: payload.audience_scope ?? "perennial_mandalism",
      publication_state: normalizePublicationState(
        payload.publication_state ?? "draft",
        publishAt.toISOString(),
        expireAt?.toISOString() ?? null,
      ),
      metadata: payload.metadata ?? {},
    },
  };
}

export async function listAdminDashboardContent(
  filters: DashboardContentAdminFilters = {},
) {
  const admin = createAdminClient();
  let query = admin
    .from("dashboard_content_items")
    .select("*")
    .eq("dashboard_scope", "perennial_mandalism")
    .order("is_pinned", { ascending: false })
    .order("publish_at", { ascending: false })
    .order("manual_sort_weight", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.publicationState) {
    query = query.eq("publication_state", filters.publicationState);
  }
  if (filters.itemMode) {
    query = query.eq("item_mode", filters.itemMode);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as DashboardContentItemRow[];
}

export async function getDashboardContentById(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dashboard_content_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? null) as DashboardContentItemRow | null;
}

export async function listDashboardContentSources() {
  const admin = createAdminClient();
  const [blogsResult, eventsResult, mandalismResult] = await Promise.all([
    admin
      .from("blog_posts")
      .select("id, title, excerpt")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(50),
    admin
      .from("calendar_events")
      .select("id, title, description, start_at")
      .eq("is_active", true)
      .order("start_at", { ascending: true })
      .limit(50),
    admin
      .from("mandalism_content")
      .select("id, title, description, content_type")
      .eq("is_published", true)
      .in("content_type", ["video", "document"])
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (blogsResult.error) throw new Error(blogsResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (mandalismResult.error) throw new Error(mandalismResult.error.message);

  const blogs: DashboardContentSourceOption[] = (blogsResult.data ?? []).map((row) => ({
    id: row.id,
    label: row.title,
    category: "blog",
    sourceTable: "blog_posts",
    description: row.excerpt,
  }));

  const events: DashboardContentSourceOption[] = (eventsResult.data ?? []).map((row) => ({
    id: row.id,
    label: row.title,
    category: "calendar_event",
    sourceTable: "calendar_events",
    description: row.description ?? (row.start_at ? `Starts ${new Date(row.start_at).toLocaleString("en-US")}` : null),
  }));

  const mandalism: DashboardContentSourceOption[] = (mandalismResult.data ?? []).map((row) => ({
    id: row.id,
    label: row.title,
    category: row.content_type === "document" ? "document" : "system_video",
    sourceTable: "mandalism_content",
    description: row.description,
  }));

  return [...blogs, ...events, ...mandalism];
}

export async function createDashboardContentItem(
  payload: DashboardContentPayload,
  userId: string,
) {
  const validated = validateDashboardContentPayload(payload);
  if (!validated.ok) {
    throw new Error((validated as { ok: false; error: string }).error);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dashboard_content_items")
    .insert({
      dashboard_scope: "perennial_mandalism",
      ...validated.value,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DashboardContentItemRow;
}

export async function updateDashboardContentItem(
  id: string,
  payload: DashboardContentPayload,
  userId: string,
) {
  const validated = validateDashboardContentPayload(payload);
  if (!validated.ok) {
    throw new Error((validated as { ok: false; error: string }).error);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("dashboard_content_items")
    .update({
      ...validated.value,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DashboardContentItemRow;
}

export async function deleteDashboardContentItem(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("dashboard_content_items").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

function extractYouTubeThumbnail(url: string | null) {
  if (!url) return null;
  const match =
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ??
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
}

async function hydrateSourceRows(items: DashboardContentItemRow[]) {
  const admin = createAdminClient();
  const blogIds = items
    .filter((item) => item.source_table === "blog_posts" && item.source_id)
    .map((item) => item.source_id as string);
  const eventIds = items
    .filter((item) => item.source_table === "calendar_events" && item.source_id)
    .map((item) => item.source_id as string);
  const mandalismIds = items
    .filter((item) => item.source_table === "mandalism_content" && item.source_id)
    .map((item) => item.source_id as string);

  const [blogsResult, eventsResult, mandalismResult] = await Promise.all([
    blogIds.length
      ? admin
          .from("blog_posts")
          .select("id, title, slug, excerpt, image_url, published_at")
          .in("id", blogIds)
      : Promise.resolve({ data: [], error: null }),
    eventIds.length
      ? admin
          .from("calendar_events")
          .select("id, title, description, start_at, end_at")
          .in("id", eventIds)
      : Promise.resolve({ data: [], error: null }),
    mandalismIds.length
      ? admin
          .from("mandalism_content")
          .select("id, title, description, url, pdf_url, content_thumbnail_url, duration_label, content_type, start_at, end_at")
          .in("id", mandalismIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (blogsResult.error) throw new Error(blogsResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (mandalismResult.error) throw new Error(mandalismResult.error.message);

  return {
    blogs: new Map((blogsResult.data ?? []).map((row) => [row.id, row])),
    events: new Map((eventsResult.data ?? []).map((row) => [row.id, row])),
    mandalism: new Map((mandalismResult.data ?? []).map((row) => [row.id, row])),
  };
}

function isRecentlyPublished(publishAt: string) {
  const publishTimestamp = new Date(publishAt).getTime();
  return Date.now() - publishTimestamp <= 7 * 24 * 60 * 60 * 1000;
}

function resolveFallbackCta(category: DashboardContentCategory) {
  switch (category) {
    case "blog":
      return { label: "Read Article", url: "/blog" };
    case "announcement":
      return { label: "Open Dashboard", url: "/community" };
    case "calendar_event":
      return { label: "View Event", url: "/community/sessions" };
    case "system_video":
      return { label: "Watch Video", url: "/community/library" };
    case "youtube_video":
      return { label: "Watch on YouTube", url: "/community/library" };
    case "document":
      return { label: "Open Guide", url: "/community/resources" };
  }
}

export async function getCommunityDashboardFeed(
  audienceScope: DashboardAudienceScope,
) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("dashboard_content_items")
    .select("*")
    .eq("dashboard_scope", "perennial_mandalism")
    .eq("is_active", true)
    .in("publication_state", ["scheduled", "published"])
    .in("audience_scope", [audienceScope, "all_members"])
    .order("is_pinned", { ascending: false })
    .order("publish_at", { ascending: false })
    .order("manual_sort_weight", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(32);

  if (error) {
    throw new Error(error.message);
  }

  const items = ((data ?? []) as DashboardContentItemRow[]).filter((item) => {
    if (new Date(item.publish_at).getTime() > Date.now()) {
      return false;
    }
    if (item.expire_at && new Date(item.expire_at).getTime() <= Date.now()) {
      return false;
    }
    return true;
  }).slice(0, 12);
  const sources = await hydrateSourceRows(items);

  return items.map((item) => {
    const fallbackCta = resolveFallbackCta(item.category);
    let title = item.title;
    let description = item.description;
    let thumbnailUrl = item.thumbnail_url;
    let ctaLabel = item.cta_label ?? fallbackCta.label;
    let ctaUrl = item.cta_url ?? fallbackCta.url;
    const sourceMetadata: Record<string, unknown> = {
      itemMode: item.item_mode,
      publicationState: item.publication_state,
    };

    if (item.source_table === "blog_posts" && item.source_id) {
      const source = sources.blogs.get(item.source_id);
      if (source) {
        title = item.title || source.title;
        description = item.description ?? source.excerpt ?? null;
        thumbnailUrl = item.thumbnail_url ?? source.image_url ?? null;
        ctaUrl = item.cta_url ?? `/blog/${source.slug}`;
        sourceMetadata.slug = source.slug;
      }
    }

    if (item.source_table === "calendar_events" && item.source_id) {
      const source = sources.events.get(item.source_id);
      if (source) {
        title = item.title || source.title;
        description = item.description ?? source.description ?? null;
        ctaUrl = item.cta_url ?? "/community/sessions";
        sourceMetadata.start_at = source.start_at;
        sourceMetadata.end_at = source.end_at;
      }
    }

    if (item.source_table === "mandalism_content" && item.source_id) {
      const source = sources.mandalism.get(item.source_id);
      if (source) {
        title = item.title || source.title;
        description = item.description ?? source.description ?? null;
        thumbnailUrl = item.thumbnail_url ?? source.content_thumbnail_url ?? null;
        ctaUrl =
          item.cta_url ??
          source.url ??
          source.pdf_url ??
          (item.category === "document" ? "/community/resources" : "/community/library");
        if (source.duration_label) {
          sourceMetadata.duration_label = source.duration_label;
        }
        if (source.start_at) {
          sourceMetadata.start_at = source.start_at;
        }
        if (source.end_at) {
          sourceMetadata.end_at = source.end_at;
        }
      }
    }

    if (item.category === "youtube_video") {
      thumbnailUrl =
        item.thumbnail_url ??
        extractYouTubeThumbnail(item.cta_url ?? String(item.metadata?.youtube_url ?? "")) ??
        null;
      ctaUrl = item.cta_url ?? String(item.metadata?.youtube_url ?? fallbackCta.url);
    }

    return {
      id: item.id,
      category: item.category,
      title,
      description,
      thumbnailUrl,
      badgeLabel: CATEGORY_LABELS[item.category],
      publishAt: item.publish_at,
      ctaLabel,
      ctaUrl,
      isPinned: item.is_pinned,
      isNew: isRecentlyPublished(item.publish_at),
      sourceMetadata,
    } satisfies DashboardFeedItem;
  });
}
