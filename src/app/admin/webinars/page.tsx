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

export const metadata = { title: "Webinars — Admin" };
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminWebinarsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: webinars } = await admin
    .from("webinars")
    .select("id, title, host_name, scheduled_at, is_free, is_active")
    .order("scheduled_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webinars</h1>
          <p className="text-muted-foreground">Manage live and recorded webinars</p>
        </div>
        <Button asChild>
          <Link href="/admin/webinars/new">New Webinar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Webinars</CardTitle>
        </CardHeader>
        <CardContent>
          {!webinars || webinars.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No webinars yet. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webinars.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.title}</TableCell>
                    <TableCell className="text-muted-foreground">{w.host_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(w.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={w.is_free ? "bg-blue-500/10 text-blue-500" : "bg-yellow-500/10 text-yellow-500"}>
                        {w.is_free ? "Free" : "Paid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={w.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {w.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/webinars/${w.id}/edit`} className="text-sm text-blue-500 hover:underline">
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
