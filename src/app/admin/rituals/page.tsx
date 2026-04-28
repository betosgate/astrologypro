import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
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
import { Video } from "lucide-react";

export const metadata = { title: "Ritual Invocations — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRitualsPage() {
  const user = await requireAdmin();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: rituals } = await admin
    .from("ritual_invocations")
    .select("id, name, priority, is_active, video_url, created_at")
    .order("priority", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ritual Configurations</h1>
          <p className="text-muted-foreground">Manage ritual invocations</p>
        </div>
        <Button asChild>
          <Link href="/admin/rituals/new">New Ritual</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Ritual Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {!rituals || rituals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No rituals yet. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rituals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.priority}</TableCell>
                    <TableCell>
                      {r.video_url ? (
                        <span title={r.video_url}>
                          <Video className="size-4 text-amber-500" />
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={r.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/rituals/${r.id}/edit`} className="text-sm text-blue-500 hover:underline">
                        Edit
                      </Link>
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
