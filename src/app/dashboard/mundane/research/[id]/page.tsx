import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, FileText, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardMundaneResearchDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: project, error } = await admin
    .from("mundane_research_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !project) notFound();

  // Object-level authorization
  if (project.created_by !== user.id && !project.is_public) notFound();

  // Notes + entities in parallel
  const [notesRes, entitiesRes] = await Promise.all([
    admin
      .from("mundane_project_notes")
      .select("id, title, body, note_type, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    (project.entity_ids?.length ?? 0) > 0
      ? admin
          .from("mundane_entities")
          .select("id, name, flag_emoji")
          .in("id", project.entity_ids)
      : Promise.resolve({ data: [] }),
  ]);

  const notes = notesRes.data ?? [];
  const entities = entitiesRes.data ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/mundane/research"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to research
      </Link>

      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <BookOpen className="size-4" />
          <span className="capitalize">{project.project_type.replace(/_/g, " ")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-2">{project.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`capitalize ${STATUS_BADGE[project.status] ?? ""}`}
        >
          {project.status}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="size-3" />
          Created {formatDateTime(project.created_at)}
        </Badge>
      </div>

      {entities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Focus Entities</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {entities.map((e: { id: string; name: string; flag_emoji: string | null }) => (
                <Link
                  key={e.id}
                  href={`/community/mundane/${e.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm hover:bg-muted/50"
                >
                  <span>{e.flag_emoji ?? "🌐"}</span>
                  <span>{e.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-sky-500" />
            Notes ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map(
                (n: {
                  id: string;
                  title: string | null;
                  body: string;
                  note_type: string | null;
                  created_at: string;
                }) => (
                  <div
                    key={n.id}
                    className="border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {n.title && <p className="font-medium text-sm">{n.title}</p>}
                      <div className="flex items-center gap-2 ml-auto">
                        {n.note_type && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {n.note_type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(n.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{n.body}</p>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
