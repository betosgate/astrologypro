import { User, BookOpen } from "lucide-react";

interface CampaignDestinationBadgeProps {
  destinationType: "PROFILE" | "SERVICE" | null;
  serviceName?: string | null;
  className?: string;
}

export function CampaignDestinationBadge({
  destinationType,
  serviceName,
  className = "",
}: CampaignDestinationBadgeProps) {
  if (!destinationType) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        — No destination
      </span>
    );
  }

  if (destinationType === "PROFILE") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
        <User className="size-3 shrink-0 text-blue-500" />
        Profile
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}
      title={serviceName ?? undefined}
    >
      <BookOpen className="size-3 shrink-0 text-purple-500" />
      <span className="truncate max-w-[120px]">{serviceName ?? "Service"}</span>
    </span>
  );
}
