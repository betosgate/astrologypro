import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Users, Star } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Community - AstrologyPro" };

export default async function CommunityDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_type, membership_status, joined_at, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");

  const isMysterySchool = member.membership_type === "mystery_school";
  const programName = isMysterySchool ? "Mystery School" : "Perennial Mandalism";

  const features = isMysterySchool
    ? [
        { icon: BookOpen, title: "Learning Library", description: "Access courses and study materials on astrology, tarot, and esoteric traditions.", href: "/community/resources" },
        { icon: Calendar, title: "Live Classes", description: "Join weekly live sessions with master practitioners.", href: "/community/sessions" },
        { icon: Users, title: "Study Circles", description: "Connect with fellow students for practice and discussion.", href: "/community/sessions" },
        { icon: Star, title: "Mentored Readings", description: "Submit practice readings for feedback from senior practitioners.", href: "/community/sessions" },
      ]
    : [
        { icon: Star, title: "Wisdom Circles", description: "Participate in group readings and cosmic event ceremonies.", href: "/community/sessions" },
        { icon: Calendar, title: "New Moon Sessions", description: "Monthly group intention-setting and divination circles.", href: "/community/sessions" },
        { icon: BookOpen, title: "Sacred Texts", description: "Curated library of perennial wisdom and mandalist teachings.", href: "/community/resources" },
        { icon: Users, title: "Community Forum", description: "Connect with fellow members on your path.", href: "/community/sessions" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{programName}</h1>
          <p className="text-muted-foreground">
            Welcome, {member.full_name ?? "member"} · Member since{" "}
            {new Date(member.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge variant={member.membership_status === "active" ? "default" : "secondary"}>
          {member.membership_status}
        </Badge>
      </div>

      {member.expires_at && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-3">
            <p className="text-sm text-amber-600">
              Membership expires{" "}
              {new Date(member.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mystery School upgrade CTA for Perennial Mandalism members */}
      {!isMysterySchool && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
            <div>
              <p className="font-semibold">Ready to go deeper?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upgrade to Mystery School — 12-week foundation + year-long decan practice.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/community/upgrade">Explore Mystery School →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title} className="transition-colors hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{f.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={f.href}>Explore</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
