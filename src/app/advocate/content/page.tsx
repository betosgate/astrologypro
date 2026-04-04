import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Content - AstrologyPro" };

export default async function AdvocateContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id, referral_code")
    .eq("user_id", user.id)
    .single();

  if (!advocate) redirect("/join/advocate");

  // Fetch shareable marketing content
  const { data: contents } = await supabase
    .from("marketing_content")
    .select("id, title, content_type, platform, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shareable Content</h1>
        <p className="text-muted-foreground">Ready-made posts for you to share. Your referral code is automatically included.</p>
      </div>

      {!contents || contents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No content available yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contents.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{c.platform}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground capitalize">{c.content_type}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
