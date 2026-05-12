export function getInvitedRoleDestination(role: string | undefined): string {
  switch (role) {
    case "diviner":
      return "/onboarding?invited=true";
    case "trainee":
      return "/join/trainee/plan?invited=true";
    case "perennial_mandalism":
    case "community_perennial_mandalism":
      return "/community/onboarding?invited=true";
    case "mystery_school":
    case "community_mystery_school":
      return "/join/mystery-school?invited=true";
    case "social_advo":
      return "/join/advocate?invited=true";
    case "client":
      return "/portal";
    default:
      return "/onboarding";
  }
}
