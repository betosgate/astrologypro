import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import tarotSpreads from "@/data/tarot-spreads";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DIFFICULTY_VARIANT: Record<
  "Beginner" | "Intermediate" | "Advanced",
  "secondary" | "outline" | "default"
> = {
  Beginner: "secondary",
  Intermediate: "outline",
  Advanced: "default",
};

export const metadata = { title: "Tarot Spreads - AstrologyPro" };

export default async function TarotSpreadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarot Spreads</h1>
          <p className="mt-1 text-muted-foreground">
            Choose a spread and begin an interactive card reading.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/community/tarot/history">My Reading History</Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tarotSpreads.map((spread) => (
          <Card
            key={spread.slug}
            className="flex flex-col border bg-card transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{spread.name}</CardTitle>
                <Badge variant={DIFFICULTY_VARIANT[spread.difficulty]} className="shrink-0 text-xs">
                  {spread.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">
                  {spread.cardCount} {spread.cardCount === 1 ? "card" : "cards"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                {spread.purpose}
              </CardDescription>
              <div className="mt-auto">
                <Button asChild className="w-full" size="sm">
                  <Link href={`/community/tarot/${spread.slug}`}>Begin Reading</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
