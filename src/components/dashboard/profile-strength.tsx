import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Camera,
  FileText,
  Quote,
  Sparkles,
  ListChecks,
  MessageSquare,
  CreditCard,
  CalendarSync,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface ProfileStrengthProps {
  diviner: {
    avatar_url: string | null;
    bio: string | null;
    tagline: string | null;
    specialties: string[] | null;
    stripe_account_id: string | null;
    google_calendar_token: string | null;
  };
  activeServicesCount: number;
  approvedTestimonialCount: number;
}

interface ChecklistItem {
  label: string;
  complete: boolean;
  href: string;
  icon: React.ElementType;
  action: string;
}

export function ProfileStrength({
  diviner,
  activeServicesCount,
  approvedTestimonialCount,
}: ProfileStrengthProps) {
  const items: ChecklistItem[] = [
    {
      label: "Upload a profile photo",
      complete: diviner.avatar_url !== null,
      href: "/dashboard/profile",
      icon: Camera,
      action: "Upload photo",
    },
    {
      label: "Write your bio (at least 20 characters)",
      complete: diviner.bio !== null && diviner.bio.length > 20,
      href: "/dashboard/profile",
      icon: FileText,
      action: "Write bio",
    },
    {
      label: "Set a tagline",
      complete: diviner.tagline !== null,
      href: "/dashboard/profile",
      icon: Quote,
      action: "Add tagline",
    },
    {
      label: "Add your specialties",
      complete:
        diviner.specialties !== null && diviner.specialties.length > 0,
      href: "/dashboard/profile",
      icon: Sparkles,
      action: "Add specialties",
    },
    {
      label: "Create at least 3 active services",
      complete: activeServicesCount >= 3,
      href: "/dashboard/services",
      icon: ListChecks,
      action: "Manage services",
    },
    {
      label: "Get at least 1 approved testimonial",
      complete: approvedTestimonialCount >= 1,
      href: "/dashboard/testimonials",
      icon: MessageSquare,
      action: "View testimonials",
    },
    {
      label: "Connect Stripe for payments",
      complete: diviner.stripe_account_id !== null,
      href: "/dashboard/settings",
      icon: CreditCard,
      action: "Connect Stripe",
    },
    {
      label: "Connect Google Calendar",
      complete: diviner.google_calendar_token !== null,
      href: "/dashboard/settings",
      icon: CalendarSync,
      action: "Connect calendar",
    },
  ];

  const completedCount = items.filter((i) => i.complete).length;
  const total = items.length;
  const percentage = Math.round((completedCount / total) * 100);

  // Hidden when fully complete
  if (percentage === 100) return null;

  const incompleteItems = items.filter((i) => !i.complete);

  const barColor =
    percentage < 50
      ? "bg-amber-500"
      : percentage < 100
        ? "bg-primary"
        : "bg-green-500";

  const textColor =
    percentage < 50
      ? "text-amber-500"
      : percentage < 100
        ? "text-primary"
        : "text-green-500";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Complete Your Profile</CardTitle>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Edit Profile
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={`text-xs font-semibold tabular-nums shrink-0 ${textColor}`}>
            {completedCount}/{total} · {percentage}%
          </span>
        </div>

        {/* All items — compact 2-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return item.complete ? (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground/60"
              >
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                <span className="truncate line-through">{item.label.replace(" (at least 20 characters)", "").replace("at least 3 ", "3+ ").replace("at least 1 ", "1+ ")}</span>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-1.5 text-xs hover:bg-muted/50 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="truncate">{item.label.replace(" (at least 20 characters)", "").replace("at least 3 ", "3+ ").replace("at least 1 ", "1+ ")}</span>
                </div>
                <ArrowRight className="size-3 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
