import type { RoleServicePackageCode } from "@/lib/role-service-packages.shared";

export type ProfessionalDivinationCourseTrack =
  | "tarot_reader"
  | "oracle"
  | "astrologer"
  | "professional_divination_course";

export function inferProfessionalDivinationCourseTrack(
  value: string | null | undefined,
): ProfessionalDivinationCourseTrack {
  const normalized = (value ?? "").toLowerCase();

  if (normalized.includes("oracle")) return "oracle";
  if (normalized.includes("tarot")) return "tarot_reader";
  if (normalized.includes("astrologer") || normalized.includes("astrology")) {
    return "astrologer";
  }

  return "professional_divination_course";
}

export function formatProfessionalDivinationCourseTrack(
  track: ProfessionalDivinationCourseTrack,
) {
  switch (track) {
    case "tarot_reader":
      return "Tarot Reader";
    case "oracle":
      return "Oracle";
    case "astrologer":
      return "Astrologer";
    default:
      return "Professional Divination Course";
  }
}

export function servicePackageForProfessionalDivinationCourseTrack(
  track: ProfessionalDivinationCourseTrack,
): RoleServicePackageCode | null {
  switch (track) {
    case "tarot_reader":
      return "tarot_only";
    case "astrologer":
      return "astrology_only";
    case "oracle":
      return "both";
    default:
      return null;
  }
}
