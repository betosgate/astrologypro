import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterVisiblePublicServices, isTimeBasedPublicService } from "@/lib/public-services";
import { isPublicSectionBlocked, normalizePublishPolicy } from "@/lib/diviner-publishing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const admin = createAdminClient();

  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id, username, display_name, avatar_url, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (divinerError || !diviner) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/not-found",
        title: "Diviner not found",
        status: 404,
      },
      { status: 404 }
    );
  }

  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  if (isPublicSectionBlocked(publishPolicy, "services")) {
    return NextResponse.json(
      {
        services: [],
        diviner: {
          id: diviner.id,
          username: diviner.username,
          display_name: diviner.display_name,
          avatar_url: diviner.avatar_url,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300",
        },
      }
    );
  }

  const { data: services, error: servicesError } = await admin
    .from("services")
    .select("*")
    .eq("diviner_id", diviner.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (servicesError) {
    console.error("[GET /api/public/diviners/[username]/services]", servicesError);
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/internal",
        title: "Internal server error",
        status: 500,
      },
      { status: 500 }
    );
  }

  const visibleServices = filterVisiblePublicServices(services ?? []).map((service) => ({
    ...service,
    is_time_based: isTimeBasedPublicService(service),
  }));

  return NextResponse.json(
    {
      services: visibleServices,
      diviner: {
        id: diviner.id,
        username: diviner.username,
        display_name: diviner.display_name,
        avatar_url: diviner.avatar_url,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300",
      },
    }
  );
}
