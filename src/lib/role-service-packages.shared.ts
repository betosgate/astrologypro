export const ROLE_SERVICE_PACKAGE_CODES = [
  "both",
  "astrology_only",
  "tarot_only",
] as const;

export type RoleServicePackageCode =
  (typeof ROLE_SERVICE_PACKAGE_CODES)[number];

export type ServiceCategoryCapability = "astrology" | "tarot";

export interface RoleServicePackageRow {
  package_code: RoleServicePackageCode;
  display_name: string;
  description: string | null;
  allows_astrology: boolean;
  allows_tarot: boolean;
  applies_to_roles: string[];
  default_for_roles: string[];
  is_active: boolean;
  sort_order: number;
}

export interface ResolvedRoleServicePackage {
  packageCode: RoleServicePackageCode;
  displayName: string;
  allowsAstrology: boolean;
  allowsTarot: boolean;
  allowedCategories: ServiceCategoryCapability[];
}

const FALLBACK_PACKAGE: ResolvedRoleServicePackage = {
  packageCode: "both",
  displayName: "Astrology + Tarot",
  allowsAstrology: true,
  allowsTarot: true,
  allowedCategories: ["astrology", "tarot"],
};

function coercePackageCode(value: unknown): RoleServicePackageCode | null {
  if (typeof value !== "string") return null;
  return ROLE_SERVICE_PACKAGE_CODES.includes(value as RoleServicePackageCode)
    ? (value as RoleServicePackageCode)
    : null;
}

export function resolveRoleServicePackage(
  packages: RoleServicePackageRow[],
  packageCode: unknown,
): ResolvedRoleServicePackage {
  const code = coercePackageCode(packageCode) ?? FALLBACK_PACKAGE.packageCode;
  const pkg = packages.find(
    (item) => item.package_code === code && item.is_active,
  );

  if (!pkg) return FALLBACK_PACKAGE;

  const allowedCategories: ServiceCategoryCapability[] = [];
  if (pkg.allows_astrology) allowedCategories.push("astrology");
  if (pkg.allows_tarot) allowedCategories.push("tarot");

  return {
    packageCode: pkg.package_code,
    displayName: pkg.display_name,
    allowsAstrology: pkg.allows_astrology,
    allowsTarot: pkg.allows_tarot,
    allowedCategories,
  };
}

export function filterCategoriesByPackage<T extends { category?: string | null }>(
  rows: T[],
  resolvedPackage: ResolvedRoleServicePackage,
): T[] {
  return rows.filter((row) => {
    if (!row.category) return true;
    return resolvedPackage.allowedCategories.includes(
      row.category as ServiceCategoryCapability,
    );
  });
}

export function getAllowedSpecialtiesForPackage(
  specialties: readonly string[],
  resolvedPackage: ResolvedRoleServicePackage,
): string[] {
  return specialties.filter((specialty) => {
    const normalized = specialty.toLowerCase();
    if (
      normalized.includes("astrology") &&
      !resolvedPackage.allowedCategories.includes("astrology")
    ) {
      return false;
    }
    if (
      normalized.includes("tarot") &&
      !resolvedPackage.allowedCategories.includes("tarot")
    ) {
      return false;
    }
    return true;
  });
}

export function getDefaultRoleServicePackageCode(
  packages: RoleServicePackageRow[],
  role: "diviner" | "trainee",
): RoleServicePackageCode {
  const explicit = packages.find(
    (pkg) =>
      pkg.is_active &&
      Array.isArray(pkg.default_for_roles) &&
      pkg.default_for_roles.includes(role),
  );

  return explicit?.package_code ?? FALLBACK_PACKAGE.packageCode;
}
