import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Image,
  Link2,
  PlayCircle,
  GraduationCap,
  TrendingUp,
  File,
  Inbox,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Resources - AstrologyPro" };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LessonAsset = {
  id: string;
  lesson_id: string;
  title: string;
  asset_type: "pdf" | "doc" | "image" | "link" | "other";
  url: string;
  file_size_bytes: number | null;
  is_downloadable: boolean;
  priority: number;
  lesson_title: string | null;
  category_name: string | null;
  program_name: string | null;
};

type StudyGuide = {
  id: string;
  title: string;
  pdf_url: string | null;
  video_url: string | null;
  duration_mins: number | null;
  category_name: string | null;
  program_name: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ASSET_TYPE_ORDER: Record<string, number> = {
  pdf: 0,
  doc: 1,
  image: 2,
  link: 3,
  other: 4,
};

function AssetIcon({ type }: { type: string }) {
  switch (type) {
    case "pdf":
      return <FileText className="size-4 text-red-500" aria-hidden="true" />;
    case "doc":
      return <File className="size-4 text-blue-500" aria-hidden="true" />;
    case "image":
      return <Image className="size-4 text-green-500" aria-hidden="true" />;
    case "link":
      return <Link2 className="size-4 text-purple-500" aria-hidden="true" />;
    default:
      return <File className="size-4 text-muted-foreground" aria-hidden="true" />;
  }
}

const ASSET_TYPE_LABEL: Record<string, string> = {
  pdf: "PDF",
  doc: "Document",
  image: "Image",
  link: "Link",
  other: "File",
};

const ASSET_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pdf: "destructive",
  doc: "default",
  image: "secondary",
  link: "outline",
  other: "secondary",
};

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function TraineeResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, training_status, graduated_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");

  // Fetch resources from API route via admin client (server-side call)
  const admin = createAdminClient();

  // Resolve role slugs
  const [divinerRow, communityRow, advocateRow, affiliateRow] =
    await Promise.all([
      admin.from("diviners").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("community_members").select("membership_type").eq("user_id", user.id).maybeSingle(),
      admin.from("social_advocates").select("id").eq("user_id", user.id).maybeSingle(),
      admin.from("affiliates").select("id").eq("user_id", user.id).maybeSingle(),
    ]);

  const userSlugs: string[] = ["is_trainee"];
  if (divinerRow.data) userSlugs.push("is_astrologer");
  if (advocateRow.data) userSlugs.push("is_social_advo");
  if (affiliateRow.data) userSlugs.push("is_affiliate");
  if (communityRow.data) {
    if (communityRow.data.membership_type === "mystery_school") userSlugs.push("is_mystery_school");
    if (communityRow.data.membership_type === "perennial_mandalism") userSlugs.push("is_Perennial_Mandalism");
  }

  // Fetch accessible programs
  const { data: programs } = await admin
    .from("training_programs")
    .select("id, name, allowed_roles")
    .eq("is_active", true);

  const accessibleProgramIds = (programs ?? [])
    .filter((p) => {
      const allowed: string[] = (p as { allowed_roles?: string[] }).allowed_roles ?? [];
      return allowed.length === 0 || userSlugs.some((s) => allowed.includes(s));
    })
    .map((p) => p.id);

  let assets: LessonAsset[] = [];
  let studyGuides: StudyGuide[] = [];

  if (accessibleProgramIds.length > 0) {
    const { data: categories } = await admin
      .from("training_categories")
      .select("id, name, training_id")
      .in("training_id", accessibleProgramIds)
      .eq("is_active", true);

    const categoryIds = (categories ?? []).map((c) => c.id);

    if (categoryIds.length > 0) {
      const { data: lessons } = await admin
        .from("training_lessons")
        .select("id, title, category_id, pdf_url, video_url, duration_mins")
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .order("priority", { ascending: true });

      const lessonIds = (lessons ?? []).map((l) => l.id);

      const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
      const programMap = new Map((programs ?? []).map((p) => [p.id, p]));

      if (lessonIds.length > 0) {
        const { data: rawAssets } = await admin
          .from("lesson_assets")
          .select("id, lesson_id, title, asset_type, url, file_size_bytes, is_downloadable, priority")
          .in("lesson_id", lessonIds)
          .order("priority", { ascending: true });

        assets = (rawAssets ?? []).map((a) => {
          const lesson = (lessons ?? []).find((l) => l.id === a.lesson_id);
          const cat = lesson ? categoryMap.get(lesson.category_id) : null;
          const prog = cat ? programMap.get(cat.training_id) : null;
          return {
            ...a,
            asset_type: a.asset_type as LessonAsset["asset_type"],
            lesson_title: lesson?.title ?? null,
            category_name: cat?.name ?? null,
            program_name: prog?.name ?? null,
          };
        });
      }

      studyGuides = (lessons ?? [])
        .filter((l) => l.pdf_url || l.video_url)
        .map((l) => {
          const cat = categoryMap.get(l.category_id);
          const prog = cat ? programMap.get(cat.training_id) : null;
          return {
            id: l.id,
            title: l.title,
            pdf_url: l.pdf_url ?? null,
            video_url: l.video_url ?? null,
            duration_mins: l.duration_mins ?? null,
            category_name: cat?.name ?? null,
            program_name: (prog as { name?: string } | null)?.name ?? null,
          };
        });
    }
  }

  // Group assets by type, sorted canonically
  const assetsByType = assets.reduce<Record<string, LessonAsset[]>>((acc, a) => {
    const key = a.asset_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const sortedTypes = Object.keys(assetsByType).sort(
    (a, b) => (ASSET_TYPE_ORDER[a] ?? 99) - (ASSET_TYPE_ORDER[b] ?? 99)
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-muted-foreground">
          Study materials, guides, and reference charts from your training programs.
        </p>
      </div>

      {/* ── Quick Links ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/trainee/training">
                <BookOpen className="mr-1.5 size-3.5" aria-hidden="true" />
                Training Center
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/trainee/progress">
                <TrendingUp className="mr-1.5 size-3.5" aria-hidden="true" />
                My Progress
              </Link>
            </Button>
            {trainee.graduated_at && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/trainee/certificate">
                  <GraduationCap className="mr-1.5 size-3.5" aria-hidden="true" />
                  Certificate
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Lesson Assets ── */}
      <section aria-labelledby="assets-heading">
        <div className="mb-4">
          <h2 id="assets-heading" className="text-lg font-semibold">
            Lesson Assets
          </h2>
          <p className="text-sm text-muted-foreground">
            Downloadable files and links from your accessible lessons.
          </p>
        </div>

        {assets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Inbox className="size-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-sm">No assets yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assets will appear here as your lessons are updated with downloadable materials.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedTypes.map((type) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AssetIcon type={type} />
                    <CardTitle className="text-sm font-semibold">
                      {ASSET_TYPE_LABEL[type] ?? type}s
                    </CardTitle>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {assetsByType[type].length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ul role="list" className="divide-y">
                    {assetsByType[type].map((asset) => (
                      <li
                        key={asset.id}
                        className="flex items-start justify-between gap-4 px-6 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {asset.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            {asset.lesson_title && (
                              <span className="truncate">{asset.lesson_title}</span>
                            )}
                            {asset.category_name && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{asset.category_name}</span>
                              </>
                            )}
                            {asset.file_size_bytes && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{formatBytes(asset.file_size_bytes)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={ASSET_TYPE_VARIANT[asset.asset_type] ?? "secondary"}
                            className="hidden text-xs sm:inline-flex"
                          >
                            {ASSET_TYPE_LABEL[asset.asset_type] ?? asset.asset_type}
                          </Badge>
                          {asset.is_downloadable ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 px-2"
                            >
                              <a
                                href={asset.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Download ${asset.title}`}
                              >
                                <Download className="size-3.5" aria-hidden="true" />
                                <span className="ml-1.5 hidden sm:inline">Download</span>
                              </a>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 px-2"
                            >
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${asset.title}`}
                              >
                                <ExternalLink className="size-3.5" aria-hidden="true" />
                                <span className="ml-1.5 hidden sm:inline">Open</span>
                              </a>
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Study Guides ── */}
      <section aria-labelledby="guides-heading">
        <div className="mb-4">
          <h2 id="guides-heading" className="text-lg font-semibold">
            Study Guides
          </h2>
          <p className="text-sm text-muted-foreground">
            Lessons with attached PDF guides or video recordings.
          </p>
        </div>

        {studyGuides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="size-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-sm">No study guides yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF guides and video recordings will appear here as your mentor adds them to lessons.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {studyGuides.map((guide) => (
              <Card key={guide.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold leading-snug">
                    {guide.title}
                  </CardTitle>
                  {(guide.category_name || guide.program_name) && (
                    <CardDescription className="text-xs">
                      {[guide.program_name, guide.category_name]
                        .filter(Boolean)
                        .join(" › ")}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto flex items-center gap-2 pt-0">
                  {guide.duration_mins && (
                    <span className="text-xs text-muted-foreground">
                      {guide.duration_mins} min
                    </span>
                  )}
                  <div className="ml-auto flex gap-2">
                    {guide.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={guide.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Download PDF for ${guide.title}`}
                        >
                          <FileText className="mr-1.5 size-3.5" aria-hidden="true" />
                          PDF
                        </a>
                      </Button>
                    )}
                    {guide.video_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={guide.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Watch video for ${guide.title}`}
                        >
                          <PlayCircle className="mr-1.5 size-3.5" aria-hidden="true" />
                          Video
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/trainee/training">
                        Go to training
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
