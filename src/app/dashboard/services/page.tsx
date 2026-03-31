import { createClient } from "@/lib/supabase/server";
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
import {
  ActiveToggle,
  FeaturedToggle,
} from "@/components/dashboard/service-toggles";
import { ServiceEditSheet } from "@/components/dashboard/service-edit-sheet";

export const metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          Manage the services you offer to clients.
        </p>
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              No services yet. Add your first service to start accepting
              bookings.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
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
                    <TableCell>{service.duration} min</TableCell>
                    <TableCell>
                      {formatCurrency(service.price / 100)}
                    </TableCell>
                    <TableCell>
                      <FeaturedToggle
                        serviceId={service.id}
                        featured={service.featured ?? false}
                      />
                    </TableCell>
                    <TableCell>
                      <ActiveToggle
                        serviceId={service.id}
                        active={service.active ?? true}
                      />
                    </TableCell>
                    <TableCell>
                      <ServiceEditSheet
                        service={{
                          id: service.id,
                          name: service.name,
                          description: service.description,
                          duration: service.duration,
                          price: service.price,
                          overage_rate: service.overage_rate,
                          featured: service.featured ?? false,
                        }}
                      />
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
