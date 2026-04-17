/**
 * GET /api/dashboard/campaigns/destinations
 * Returns allowed campaign destinations for the authenticated diviner:
 *   - profile: their own diviner profile
 *   - services: enabled (is_enabled = true) services with template info
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Resolve diviner record
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username, display_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // Profile destination
  const profile = {
    id: diviner.id,
    type: "PROFILE" as const,
    label: "My Profile Page",
    username: diviner.username,
    url: `/${diviner.username}`,
    display_name: diviner.display_name,
    avatar_url: diviner.avatar_url ?? null,
  };

  // Enabled services — join diviner_services with service_templates
  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select(
      "id, template_id, price, is_enabled, is_published, publish_status, service_templates(id, name, slug, category, duration_minutes, base_price, is_active)"
    )
    .eq("diviner_id", diviner.id)
    .eq("is_enabled", true)
    .order("template_id");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  const services = (divinerServices ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((ds: any) => ds.service_templates?.is_active === true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ds: any) => ({
      id: ds.template_id as string,
      type: "SERVICE" as const,
      diviner_service_id: ds.id as string,
      template_name: ds.service_templates.name as string,
      template_slug: ds.service_templates.slug as string,
      category: ds.service_templates.category as string,
      url: `/${diviner.username}/services/${ds.service_templates.slug}`,
      share_url: `${appUrl}/${diviner.username}/services/${ds.service_templates.slug}`,
      price: typeof ds.price === "number" ? ds.price : Number(ds.price),
      duration_minutes: ds.service_templates.duration_minutes as number,
      is_published: ds.is_published as boolean,
      publish_status: (ds.publish_status as string) ?? "draft",
    }))
    .sort((a: { category: string; template_name: string }, b: { category: string; template_name: string }) => {
      const cat = a.category.localeCompare(b.category);
      return cat !== 0 ? cat : a.template_name.localeCompare(b.template_name);
    });

  return NextResponse.json({ profile, services });
}
