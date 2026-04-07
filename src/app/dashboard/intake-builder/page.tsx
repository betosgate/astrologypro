import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { IntakeBuilderClient } from "@/components/dashboard/intake-builder-client";
import type { IntakeTemplate } from "@/lib/intake-fields";

export const metadata = {
  title: "Intake Builder",
};

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  intake_template_id: string | null;
}

export default async function IntakeBuilderPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  // Fetch services and templates in parallel
  const [servicesResult, templatesResult] = await Promise.all([
    admin
      .from("services")
      .select("id, name, category, intake_template_id")
      .eq("diviner_id", diviner.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("intake_templates")
      .select("id, name, description, is_default, fields, created_at, updated_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: true }),
  ]);

  const services = (servicesResult.data ?? []) as ServiceRow[];
  const templates = (templatesResult.data ?? []) as IntakeTemplate[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Intake Builder</h1>
        <p className="text-muted-foreground">
          Create reusable intake templates and assign them to your services.
        </p>
      </div>

      <IntakeBuilderClient
        divinerId={diviner.id}
        services={services}
        templates={templates}
      />
    </div>
  );
}
