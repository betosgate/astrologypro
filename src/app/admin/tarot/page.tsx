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

export const metadata = { title: "Tarot — Admin" };
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminTarotPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) redirect("/dashboard");

  const admin = createAdminClient();
  const [spreadsResult, cardsResult] = await Promise.all([
    admin.from("tarot_spreads").select("id, name, card_count, priority, is_active").order("priority", { ascending: true }),
    admin.from("tarot_cards").select("id, name, arcana, suit, spread_id, tarot_spreads(name)").order("created_at", { ascending: false }).limit(200),
  ]);

  const spreads = spreadsResult.data ?? [];
  const cards = cardsResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarot</h1>
        <p className="text-muted-foreground">Manage tarot spreads and cards</p>
      </div>

      {/* Spreads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Spreads</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/tarot/spreads/new">New Spread</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {spreads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No spreads yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Card Count</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spreads.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.card_count}</TableCell>
                    <TableCell>{s.priority}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Cards</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/tarot/cards/new">New Card</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No cards yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Arcana</TableHead>
                  <TableHead>Suit</TableHead>
                  <TableHead>Spread</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.arcana === "major" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}>
                        {c.arcana}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.suit ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.tarot_spreads?.name ?? "—"}</TableCell>
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
