import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { ClientsSearch } from "@/components/dashboard/clients-search";
import { ClientDetailSheet } from "@/components/dashboard/client-detail-sheet";

export const metadata = {
  title: "Clients",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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

  if (!diviner) redirect("/onboarding");

  // Fetch client relationships with aggregated booking data
  const { data: clientRelations } = await supabase
    .from("client_diviners")
    .select(
      "id, client_id, total_sessions, total_spent, last_session_at, clients(id, full_name, email, birth_date)"
    )
    .eq("diviner_id", diviner.id)
    .order("last_session_at", { ascending: false });

  // Filter by search query if present
  let clients = clientRelations ?? [];
  if (q) {
    const query = q.toLowerCase();
    clients = clients.filter((c: any) => {
      const name = c.clients?.full_name?.toLowerCase() ?? "";
      const email = c.clients?.email?.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            View and manage your client relationships.
          </p>
        </div>
        <Suspense>
          <ClientsSearch />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
            {q ? ` matching "${q}"` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {q ? "No clients match your search." : "No clients yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Total Sessions</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Session</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((relation: any) => {
                  const client = relation.clients;
                  return (
                    <TableRow key={relation.id}>
                      <TableCell className="font-medium">
                        {client?.full_name ?? "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client?.email ?? "--"}
                      </TableCell>
                      <TableCell>
                        {client?.birth_date
                          ? formatDate(client.birth_date)
                          : "--"}
                      </TableCell>
                      <TableCell>{relation.total_sessions ?? 0}</TableCell>
                      <TableCell>
                        {formatCurrency(relation.total_spent ?? 0)}
                      </TableCell>
                      <TableCell>
                        {relation.last_session_at
                          ? formatDate(relation.last_session_at)
                          : "--"}
                      </TableCell>
                      <TableCell>
                        <ClientDetailSheet
                          clientId={client?.id}
                          clientName={client?.full_name ?? "Client"}
                          divinerId={diviner.id}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
