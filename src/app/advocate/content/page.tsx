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
    .select("id, title, description, caption_template, category, platforms, image_url, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const referralCode = advocate.referral_code ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shareable Content</h1>
        <p className="text-muted-foreground">
          Ready-made posts for you to share. Your referral code{" "}
          <span className="font-mono font-semibold text-foreground">{referralCode}</span>{" "}
          is automatically included.
        </p>
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
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {c.category?.replace(/_/g, " ") ?? "General"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                )}
                {c.caption_template && (
                  <p className="text-xs bg-muted/50 rounded p-2 font-mono line-clamp-3">
                    {c.caption_template.replace(/\[referral_code\]/gi, referralCode)}
                  </p>
                )}
                {Array.isArray(c.platforms) && c.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(c.platforms as string[]).map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px] capitalize">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
