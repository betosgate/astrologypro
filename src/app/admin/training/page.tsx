import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Training Management — Admin" };
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    redirect("/");
  }

  const admin = createAdminClient();

  const [categoriesRes, lessonsRes, quizzesRes] = await Promise.all([
    admin
      .from("training_categories")
      .select("id, name, description, priority, is_active, created_at")
      .order("priority", { ascending: true }),
    admin
      .from("training_lessons")
      .select("id, category_id, title, description, video_url, duration_mins, priority, is_active, created_at")
      .order("priority", { ascending: true }),
    admin
      .from("training_quizzes")
      .select("id, lesson_id, title, questions, pass_score, is_active, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const categories = categoriesRes.data ?? [];
  const lessons = lessonsRes.data ?? [];
  const quizzes = quizzesRes.data ?? [];

  // Build lookup maps for display
  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    categoryMap[c.id] = c.name;
  }
  const lessonMap: Record<string, string> = {};
  for (const l of lessons) {
    lessonMap[l.id] = l.title;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Management</h1>
        <p className="text-muted-foreground">
          Manage training categories, lessons, and quizzes.
        </p>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/training/categories/new">+ Add Category</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No categories yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat: any) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {cat.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{cat.priority ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cat.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(cat.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/training/categories/${cat.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>
              {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/training/lessons/new">+ Add Lesson</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No lessons yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson: any) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{lesson.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {categoryMap[lesson.category_id] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lesson.duration_mins != null
                        ? `${lesson.duration_mins} min`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{lesson.priority ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          lesson.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {lesson.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(lesson.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/training/lessons/${lesson.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quizzes */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Quizzes</CardTitle>
            <CardDescription>
              {quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/training/quiz-generate">✨ AI Generate</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/training/quizzes/new">+ Add Quiz</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No quizzes yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Pass Score</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.map((quiz: any) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lessonMap[quiz.lesson_id] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {quiz.pass_score != null ? `${quiz.pass_score}%` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {Array.isArray(quiz.questions) ? quiz.questions.length : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          quiz.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {quiz.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(quiz.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/training/quizzes/${quiz.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
