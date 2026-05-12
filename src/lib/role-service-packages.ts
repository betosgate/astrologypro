import { createAdminClient } from "@/lib/supabase/admin";
import {
  FALLBACK_ROLE_SERVICE_PACKAGES,
  type RoleServicePackageRow,
} from "@/lib/role-service-packages.shared";

export {
  FALLBACK_ROLE_SERVICE_PACKAGES,
  ROLE_SERVICE_PACKAGE_CODES,
  filterCategoriesByPackage,
  getAllowedSpecialtiesForPackage,
  getDefaultRoleServicePackageCode,
  resolveRoleServicePackage,
  type ResolvedRoleServicePackage,
  type RoleServicePackageCode,
  type RoleServicePackageRow,
  type ServiceCategoryCapability,
} from "@/lib/role-service-packages.shared";

export async function getRoleServicePackages(): Promise<RoleServicePackageRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_service_packages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("package_code", { ascending: true });

  if (error || !data) {
    console.error(
      "[role-service-packages] Failed to load packages:",
      error?.message,
    );
    return [...FALLBACK_ROLE_SERVICE_PACKAGES];
  }

  return (data as RoleServicePackageRow[]) ?? [];
}
