import { createAdminClient } from "@/lib/supabase/admin";
export {
  filterCategoriesByPackage,
  getAllowedSpecialtiesForPackage,
  getDefaultRoleServicePackageCode,
  resolveRoleServicePackage,
  ROLE_SERVICE_PACKAGE_CODES,
  type ResolvedRoleServicePackage,
  type RoleServicePackageCode,
  type RoleServicePackageRow,
  type ServiceCategoryCapability,
} from "@/lib/role-service-packages.shared";

import type { RoleServicePackageRow } from "@/lib/role-service-packages.shared";

export async function getRoleServicePackages(): Promise<RoleServicePackageRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_service_packages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("package_code", { ascending: true });

  if (error || !data) {
    console.error("[role-service-packages] Failed to load packages:", error?.message);
    return [
      {
        package_code: "both",
        display_name: "Astrology + Tarot",
        description: "Allows both astrology and tarot service categories.",
        allows_astrology: true,
        allows_tarot: true,
        applies_to_roles: ["diviner", "trainee"],
        default_for_roles: ["diviner", "trainee"],
        is_active: true,
        sort_order: 10,
      },
      {
        package_code: "astrology_only",
        display_name: "Astrology Only",
        description: "Allows astrology services only.",
        allows_astrology: true,
        allows_tarot: false,
        applies_to_roles: ["diviner", "trainee"],
        default_for_roles: [],
        is_active: true,
        sort_order: 20,
      },
      {
        package_code: "tarot_only",
        display_name: "Tarot Only",
        description: "Allows tarot services only.",
        allows_astrology: false,
        allows_tarot: true,
        applies_to_roles: ["diviner", "trainee"],
        default_for_roles: [],
        is_active: true,
        sort_order: 30,
      },
    ];
  }

  return (data as RoleServicePackageRow[]) ?? [];
}
