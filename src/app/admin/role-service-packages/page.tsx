import { createAdminClient } from "@/lib/supabase/admin";
import { RoleServicePackagesClient } from "@/components/admin/role-service-packages-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Role Service Packages — Admin" };

export default async function AdminRoleServicePackagesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("role_service_packages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("package_code", { ascending: true });

  return (
    <div className="space-y-6">
      <RoleServicePackagesClient initialPackages={(data ?? []) as never[]} />
    </div>
  );
}
