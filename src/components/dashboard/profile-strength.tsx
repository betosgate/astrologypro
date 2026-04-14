import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Complete Your Profile</CardTitle>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Edit Profile
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {total} completed
            </span>
            <span className={`font-semibold ${textColor}`}>{percentage}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Incomplete items */}
        <div className="space-y-2">
          {incompleteItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-dashed p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={item.href}>
                    {item.action}
                    <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
