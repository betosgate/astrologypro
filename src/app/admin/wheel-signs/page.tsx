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

export const metadata = { title: "Wheel Signs — Admin" };
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminWheelSignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) redirect("/dashboard");

  const admin = createAdminClient();
  const [signsResult, decansResult] = await Promise.all([
    admin.from("wheel_signs").select("id, title, start_date, end_date, priority, is_active").order("priority", { ascending: true }),
    admin.from("astro_decan_info").select("id, sign_name, planet, tarot_name, decan, is_active").order("created_at", { ascending: false }).limit(100),
  ]);

  const signs = signsResult.data ?? [];
  const decans = decansResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wheel Signs</h1>
        <p className="text-muted-foreground">Manage astrological wheel signs and decan info</p>
      </div>

      {/* Wheel Signs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Wheel Signs</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/wheel-signs/new">New Sign</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {signs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No wheel signs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.start_date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.end_date}</TableCell>
                    <TableCell>{s.priority}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/wheel-signs/${s.id}/edit`} className="text-sm text-blue-500 hover:underline">
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

      {/* Astro Decans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Astro Decan Info</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/wheel-signs/decans/new">New Decan</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {decans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No decan info yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sign Name</TableHead>
                  <TableHead>Planet</TableHead>
                  <TableHead>Tarot</TableHead>
                  <TableHead>Decan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decans.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.sign_name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.planet}</TableCell>
                    <TableCell className="text-muted-foreground">{d.tarot_name}</TableCell>
                    <TableCell>{d.decan}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={d.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {d.is_active ? "Active" : "Inactive"}
                      </Badge>
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
