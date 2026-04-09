import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Services assigned to you by admin. Contact your administrator to
            make changes.
          </p>
        </div>
        {/* Create button removed — services are now managed by admin via
            /admin/service-config. See souradip/admin-module/task 04. */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Services</CardTitle>
          <CardDescription>
            {services?.length ?? 0} service{(services?.length ?? 0) !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!services || services.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Sparkles className="size-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No services assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your admin has not yet assigned any services to your account.
                  Contact your administrator for assistance.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="secondary">{service.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>{service.duration_minutes} min</TableCell>
                    <TableCell>
                      {formatCurrency(service.base_price)}
                    </TableCell>
                    <TableCell>
                      {service.is_featured ? (
                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                          Featured
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          service.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {service.is_active ? "Active" : "Inactive"}
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
