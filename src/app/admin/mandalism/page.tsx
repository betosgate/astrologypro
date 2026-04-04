import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
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

export const metadata = { title: "Mandalism Content — Admin" };
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const CONTENT_TYPE_LABELS: Record<string, string> = {
  live_stream: "Live Stream",
  video: "Video",
  document: "Document",
  youtube: "YouTube",
  announcement: "Announcement",
};

export default async function AdminMandalismPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: content } = await admin
    .from("mandalism_content")
    .select("id, title, content_type, access_control, is_published, priority, created_at")
    .order("priority", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mandalism Content</h1>
          <p className="text-muted-foreground">Manage Perennial Mandalism content library</p>
        </div>
        <Button asChild>
          <Link href="/admin/mandalism/new">New Content</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
        </CardHeader>
        <CardContent>
          {!content || content.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No content yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.access_control === "free"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-amber-500/10 text-amber-600"
                        }
                      >
                        {item.access_control === "free" ? "Free" : "Members only"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.priority ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.is_published
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/mandalism/${item.id}/edit`}>Edit</Link>
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
