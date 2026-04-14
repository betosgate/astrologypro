import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, BookOpen, Lock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mundane Research Portal",
};

type Publication = {
  id: string;
  title: string;
  subtitle: string | null;
  report_type: string;
  published_at: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  monthly_digest: "Monthly Digest",
  eclipse_report: "Eclipse Report",
  ingress_report: "Ingress Report",
  leader_watch: "Leader Watch",
  custom: "Report",
};

const TYPE_BADGE: Record<string, string> = {
  monthly_digest: "bg-blue-100 text-blue-700 border-blue-200",
  eclipse_report: "bg-purple-100 text-purple-700 border-purple-200",
  ingress_report: "bg-teal-100 text-teal-700 border-teal-200",
  leader_watch: "bg-amber-100 text-amber-700 border-amber-200",
  custom: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MundanePortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/portal/mundane");
  }

  const admin = createAdminClient();

  // Check for an active mundane subscription by user_id or email
  const { data: subscription } = await admin
    .from("mundane_subscriptions")
    .select("id, plan, status, access_level, workspace_id, expires_at")
    .or(`subscriber_user_id.eq.${user.id},subscriber_email.eq.${user.email}`)
    .eq("status", "active")
    .maybeSingle();

  const isSubscribed =
    !!subscription &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  // If not subscribed, show gate
  if (!isSubscribed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center size-16 rounded-2xl bg-sky-100">
              <Globe className="size-8 text-sky-600" />
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mundane Research Portal</h1>
            <p className="text-muted-foreground mt-2">
              Access in-depth mundane astrology research, forecasts, and eclipse reports from our
              research team.
            </p>
          </div>
          <Card className="border-dashed">
            <CardContent className="pt-5 pb-5 flex flex-col items-center gap-3">
              <Lock className="size-6 text-muted-foreground" />
              <p className="font-medium">Subscription Required</p>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have an active subscription to this portal. Contact us to get access.
              </p>
              <Button asChild className="mt-1">
                <Link href="/contact">
                  Get Access <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium">{user.email}</span>
          </p>
        </div>
      </div>
    );
  }

  // Fetch published publications
  const { data: publications } = await admin
    .from("mundane_publications")
    .select("id, title, subtitle, report_type, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  const pubs = (publications ?? []) as Publication[];

  const planColors: Record<string, string> = {
    basic: "bg-blue-100 text-blue-700 border-blue-200",
    premium: "bg-violet-100 text-violet-700 border-violet-200",
    enterprise: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="size-7 text-sky-500" />
              <h1 className="text-2xl font-bold">Mundane Research Portal</h1>
            </div>
            <p className="text-muted-foreground">
              Published research, forecasts, and reports from our astrologers.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={`capitalize ${planColors[subscription.plan] ?? ""}`}
            >
              {subscription.plan} plan
            </Badge>
            <span className="text-xs text-muted-foreground capitalize">
              {subscription.access_level} access
            </span>
          </div>
        </div>

        {/* Publications list */}
        {pubs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <BookOpen className="size-10 text-muted-foreground/40" />
              <p className="font-medium">No publications yet</p>
              <p className="text-sm text-muted-foreground">
                New research reports will appear here as they are published.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {pubs.length} Publication{pubs.length !== 1 ? "s" : ""}
            </h2>
            {pubs.map((pub) => (
              <Link
                key={pub.id}
                href={`/portal/mundane/publications/${pub.id}`}
                className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm hover:bg-muted/20 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${TYPE_BADGE[pub.report_type] ?? TYPE_BADGE.custom}`}
                    >
                      {TYPE_LABEL[pub.report_type] ?? pub.report_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {pub.published_at
                        ? formatDate(pub.published_at)
                        : formatDate(pub.created_at)}
                    </span>
                  </div>
                  <p className="font-semibold leading-snug group-hover:text-primary transition-colors">
                    {pub.title}
                  </p>
                  {pub.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{pub.subtitle}</p>
                  )}
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
