import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research — Mundane" };

type Project = {
  id: string;
  title: string;
  description: string | null;
  project_type: string;
  status: string;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardMundaneResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const status = sp.status ?? "";

  const admin = createAdminClient();
  const VALID = ["active", "archived", "completed"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_research_projects")
    .select("id, title, description, project_type, status, created_at")
    .eq("created_by", user.id);

  if (status && VALID.includes(status)) query = query.eq("status", status);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    return <div className="text-destructive text-sm">Failed to load projects: {error.message}</div>;
  }

  const projects = (data ?? []) as Project[];

  const FILTERS = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Mundane
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="size-6 text-rose-500" />
          Research
        </h1>
        <p className="text-muted-foreground">Your research projects and notes.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/mundane/research${opt.value ? `?status=${opt.value}` : ""}`}
          >
            <Badge variant={status === opt.value ? "default" : "outline"} className="cursor-pointer">
              {opt.label}
            </Badge>
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            No projects {status ? `(${status})` : "yet"}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/mundane/research/${p.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.title}</p>
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {p.project_type.replace(/_/g, " ")}
                  </Badge>
                  <span>Created {formatDate(p.created_at)}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize shrink-0 ${STATUS_BADGE[p.status] ?? ""}`}
              >
                {p.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
