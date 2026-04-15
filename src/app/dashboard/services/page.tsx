import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRoleServicePackages, resolveRoleServicePackage } from "@/lib/role-service-packages";
import { ServicesClient } from "@/components/dashboard/services-client";

export const metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, service_package_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  const resolvedPackage = resolveRoleServicePackage(
    await getRoleServicePackages(),
    diviner.service_package_code,
  );

  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, duration_minutes, base_price, is_active, is_featured")
    .eq("diviner_id", diviner.id)
    .in("category", resolvedPackage.allowedCategories)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Services</h1>
            <p className="text-sm text-muted-foreground">
              Package: <span className="font-medium text-foreground">{resolvedPackage.displayName}</span>
            </p>
          </div>
        </div>
      </div>

      <ServicesClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        services={(services ?? []) as any}
        resolvedPackage={resolvedPackage}
      />
    </div>
  );
}
