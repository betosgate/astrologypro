/**
 * All user roles in the system.
 * Stored in auth.user_metadata.role at signup.
 * Role determines which portal the user is routed to after login.
 */
export type UserRole =
  | "diviner"                // Practitioner — /dashboard
  | "social_advo"            // Social Advocate — /advocate
  | "customer_socialadvo"    // Client + Social Advocate — /portal (also /advocate)
  | "perennial_mandalism"    // Perennial Mandalism member — /community
  | "mystery_school"         // Mystery School member — /community
  | "trainee";               // Trainee under a mentor diviner — /trainee

/**
 * Maps a role to its primary destination after login.
 */
export const ROLE_DESTINATIONS: Record<UserRole, string> = {
  diviner:               "/dashboard",
  social_advo:           "/advocate",
  customer_socialadvo:   "/portal",
  perennial_mandalism:   "/community",
  mystery_school:        "/community",
  trainee:               "/trainee",
};

export function getRoleDestination(role: string | undefined): string {
  if (!role) return "/portal";
  return ROLE_DESTINATIONS[role as UserRole] ?? "/portal";
}
