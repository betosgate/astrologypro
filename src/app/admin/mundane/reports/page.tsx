import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, FileText, Globe, Plus, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const REPORT_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  monthly_digest: { label: "Monthly Digest", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Calendar className="size-3" /> },
  eclipse_report: { label: "Eclipse Report", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Zap className="size-3" /> },
  ingress_report: { label: "Ingress Report", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Globe className="size-3" /> },
  leader_watch: { label: "Leader Watch", color: "bg-rose-100 text-rose-700 border-rose-200", icon: <FileText className="size-3" /> },
  custom: { label: "Custom", color: "bg-gray-100 text-gray-600 border-gray-200", icon: <FileText className="size-3" /> },
};

const TABS = [
  { value: "", label: "All" },
  { value: "monthly_digest", label: "Monthly Digest" },
  { value: "eclipse_report", label: "Eclipse Report" },
  { value: "ingress_report", label: "Ingress Report" },
  { value: "leader_watch", label: "Leader Watch" },
  { value: "custom", label: "Custom" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type Publication = {
  id: string;
  title: string;
  subtitle: string | null;
  report_type: string;
  entity_ids: string[];
  date_range_start: string | null;
  date_range_end: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

type Props = {
  searchParams: { type?: string };
};

export default async function ReportsListPage({ searchParams }: Props) {
  const adminUser = await getAdminUser();
  if (!adminUser) redirect("/admin");

  const admin = createAdminClient();
  const filterType = searchParams.type ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_publications")
    .select("id, title, subtitle, report_type, entity_ids, date_range_start, date_range_end, is_published, published_at, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  if (filterType) {
    query = query.eq("report_type", filterType);
  }

  const { data, error } = await query;

  const publications: Publication[] = error ? [] : (data ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="size-6 text-emerald-500" />
            <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Create, manage, and publish mundane astrology reports.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/admin/mundane/reports/new">
            <Plus className="size-4 mr-1.5" />New Report
          </Link>
        </Button>
      </div>

      {/* Type filter tabs */}
      <div className="border-b">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/mundane/reports?type=${tab.value}` : "/admin/mundane/reports"}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filterType === tab.value
                  ? "border-emerald-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* List */}
      {publications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen className="size-10 text-muted-foreground/30" />
            <p className="font-medium">No reports yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Create your first mundane astrology report — monthly digests, eclipse reports, ingress reports, or custom publications.
            </p>
            <Button size="sm" asChild>
              <Link href="/admin/mundane/reports/new">
                <Plus className="size-4 mr-1.5" />Create First Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {publications.map((pub) => {
            const meta = REPORT_TYPE_META[pub.report_type] ?? REPORT_TYPE_META.custom;
            return (
              <Link
                key={pub.id}
                href={`/admin/mundane/reports/${pub.id}`}
                className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-xs flex items-center gap-1 ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${pub.is_published ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      {pub.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="font-medium truncate">{pub.title}</p>
                  {pub.subtitle && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{pub.subtitle}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {pub.date_range_start && (
                      <span>
                        {fmtDate(pub.date_range_start)}
                        {pub.date_range_end ? ` – ${fmtDate(pub.date_range_end)}` : ""}
                      </span>
                    )}
                    <span>Created {fmtDate(pub.created_at)}</span>
                    {pub.entity_ids.length > 0 && (
                      <span>{pub.entity_ids.length} entit{pub.entity_ids.length !== 1 ? "ies" : "y"}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
