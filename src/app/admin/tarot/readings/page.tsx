import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Tarot Practice — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTarotReadingsPage() {
  const user = await requireAdmin();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: spreads } = await admin
    .from("tarot_spreads")
    .select("id, name, description, card_count, layout_json, image_url, priority")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarot Practice</h1>
          <p className="mt-1 text-muted-foreground">
            Choose a spread and begin an interactive card reading practice.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(spreads ?? []).map((spread) => (
          <Card
            key={spread.id}
            className="flex flex-col border bg-card transition-shadow hover:shadow-md overflow-hidden"
          >
            {spread.image_url && (
              <div className="relative h-40 w-full bg-muted">
                <img
                  src={spread.image_url}
                  alt={spread.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{spread.name}</CardTitle>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {spread.card_count} {spread.card_count === 1 ? "card" : "cards"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                {spread.description}
              </CardDescription>
              <div className="mt-auto">
                <Button asChild className="w-full" size="sm">
                  <Link href={`/admin/tarot/readings/${spread.id}`}>Begin Reading</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
