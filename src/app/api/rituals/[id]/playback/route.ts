import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface PerennialContent {
  id: string;
  title: string;
  content_type: string | null;
  video_url: string | null;
  youtube_url: string | null;
  status: string;
  priority: number | null;
}

interface PlaybackVideo {
  id: string;
  title: string;
  video_url: string | null;
  youtube_url: string | null;
  tag_type: "opening" | "gate" | "main" | "closing";
}

// GET /api/rituals/[id]/playback — fetch ritual + sequenced video playlist
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/401",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // Fetch the ritual — enforce object-level authorization
    const { data: ritual, error: ritualError } = await supabase
      .from("user_ritual_configurations")
      .select("id, ritual_name, ritual_tags, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (ritualError || !ritual) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/404",
          title: "Not Found",
          status: 404,
          detail: "Ritual not found or access denied.",
        },
        { status: 404 }
      );
    }

    const tags: string[] = ritual.ritual_tags ?? [];

    if (tags.length === 0) {
      return NextResponse.json({
        ritual,
        videos: [],
        is_dynamic: false,
      });
    }

    // Fetch matching active videos from perennial_content using admin client (bypasses RLS)
    const admin = createAdminClient();

    // Build OR conditions: title ILIKE any tag
    const titleConditions = tags.map((tag) => `title.ilike.%${tag}%`).join(",");

    const { data: contentRows, error: contentError } = await admin
      .from("perennial_content")
      .select("id, title, content_type, video_url, youtube_url, status, priority")
      .eq("status", "active")
      .or(titleConditions);

    if (contentError) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/500",
          title: "Internal Server Error",
          status: 500,
          detail: "Failed to fetch ritual content.",
        },
        { status: 500 }
      );
    }

    const rows: PerennialContent[] = contentRows ?? [];

    // Sequence videos: Opening → Gate → Main → Closing
    function classifyVideo(row: PerennialContent): PlaybackVideo["tag_type"] {
      const titleLower = row.title.toLowerCase();
      if (titleLower.includes("opening") || titleLower.includes("ritual_opening")) {
        return "opening";
      }
      if (titleLower.includes("closing") || titleLower.includes("ritual_closing")) {
        return "closing";
      }
      if (titleLower.includes("gate")) {
        return "gate";
      }
      return "main";
    }

    const opening: PlaybackVideo[] = [];
    const gate: PlaybackVideo[] = [];
    const main: PlaybackVideo[] = [];
    const closing: PlaybackVideo[] = [];

    for (const row of rows) {
      const tagType = classifyVideo(row);
      const video: PlaybackVideo = {
        id: row.id,
        title: row.title,
        video_url: row.video_url,
        youtube_url: row.youtube_url,
        tag_type: tagType,
      };
      if (tagType === "opening") opening.push(video);
      else if (tagType === "gate") gate.push(video);
      else if (tagType === "closing") closing.push(video);
      else main.push(video);
    }

    // Sort each bucket by priority (ascending), then title for determinism
    function sortByPriority(a: PlaybackVideo, b: PlaybackVideo): number {
      const rowA = rows.find((r) => r.id === a.id);
      const rowB = rows.find((r) => r.id === b.id);
      const pa = rowA?.priority ?? 999;
      const pb = rowB?.priority ?? 999;
      if (pa !== pb) return pa - pb;
      return a.title.localeCompare(b.title);
    }

    opening.sort(sortByPriority);
    gate.sort(sortByPriority);
    main.sort(sortByPriority);
    closing.sort(sortByPriority);

    const videos: PlaybackVideo[] = [
      ...opening,
      ...gate,
      ...main,
      ...closing,
    ];

    return NextResponse.json({
      ritual,
      videos,
      is_dynamic: videos.length > 1,
    });
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
