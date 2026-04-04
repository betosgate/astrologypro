import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Calendar,
  Users,
  Star,
  Flame,
  TrendingUp,
  BookMarked,
  Heart,
  GraduationCap,
  HandHeart,
} from "lucide-react";
import Link from "next/link";
import { AstroChartsSection } from "@/components/community/astro-charts-section";
import { ProfileProgressSection } from "@/components/community/profile-progress-section";

export const metadata = { title: "Community - AstrologyPro" };
export const dynamic = "force-dynamic";

export default async function CommunityDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select(
      "id, full_name, email, membership_type, membership_status, joined_at, expires_at"
    )
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");

  const isMysterySchool = member.membership_type === "mystery_school";
  const isPerennial = !isMysterySchool;
  const programName = isMysterySchool ? "Mystery School" : "Perennial Mandalism";

  // ── Parallel data fetches ──────────────────────────────────────────────────
  const [
    clientResult,
    familyMembersResult,
    otherMembersResult,
    recentWisdomResult,
    recentBlogResult,
    ritualsResult,
    contentCountsResult,
  ] = await Promise.all([
    // Client profile for progress ring calculation
    supabase
      .from("clients")
      .select("birth_date, birth_time, birth_city")
      .eq("user_id", user.id)
      .single(),

    // Family members for relationship preview
    supabase
      .from("community_family_members")
      .select("id, full_name, relationship")
      .eq("member_id", member.id)
      .limit(5),

    // Other community members for members connected count
    supabase
      .from("community_members")
      .select("id, full_name, membership_type, joined_at")
      .eq("membership_status", "active")
      .neq("user_id", user.id)
      .limit(5),

    // Recent spiritual wisdom items
    supabase
      .from("spiritual_wisdom")
      .select("id, title, descriptive_title, type, image_url, youtube_url")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .limit(3),

    // Recent blog posts
    supabase
      .from("blog_posts")
      .select("id, title, slug, category, excerpt, image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),

    // User's saved rituals
    supabase
      .from("user_ritual_configurations")
      .select("id, ritual_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),

    // Content counts — mandalism_content by type
    supabase
      .from("mandalism_content")
      .select("content_type")
      .eq("is_published", true),
  ]);

  const client = clientResult.data;
  const familyMembers = familyMembersResult.data ?? [];
  const otherMembers = otherMembersResult.data ?? [];
  const recentWisdom = recentWisdomResult.data ?? [];
  const recentBlog = recentBlogResult.data ?? [];
  const rituals = ritualsResult.data ?? [];
  const allContent = contentCountsResult.data ?? [];

  // ── Profile completion percentage ─────────────────────────────────────────
  let profilePct = 0;
  if (client?.birth_date) profilePct += 34;
  if (client?.birth_time) profilePct += 33;
  if (client?.birth_city) profilePct += 33;

  // ── Content counts by type ─────────────────────────────────────────────────
  const contentCounts: Record<string, number> = {};
  for (const item of allContent) {
    const t = item.content_type as string;
    contentCounts[t] = (contentCounts[t] ?? 0) + 1;
  }

  // ── Feature quick links ────────────────────────────────────────────────────
  const features = isMysterySchool
    ? [
        {
          icon: BookOpen,
          title: "Learning Library",
          description:
            "Access courses and study materials on astrology, tarot, and esoteric traditions.",
          href: "/community/resources",
        },
        {
          icon: Calendar,
          title: "Live Classes",
          description: "Join weekly live sessions with master practitioners.",
          href: "/community/sessions",
        },
        {
          icon: Users,
          title: "Study Circles",
          description: "Connect with fellow students for practice and discussion.",
          href: "/community/sessions",
        },
        {
          icon: Star,
          title: "Mentored Readings",
          description:
            "Submit practice readings for feedback from senior practitioners.",
          href: "/community/sessions",
        },
      ]
    : [
        {
          icon: Star,
          title: "Wisdom Circles",
          description:
            "Participate in group readings and cosmic event ceremonies.",
          href: "/community/sessions",
        },
        {
          icon: Calendar,
          title: "New Moon Sessions",
          description:
            "Monthly group intention-setting and divination circles.",
          href: "/community/sessions",
        },
        {
          icon: BookOpen,
          title: "Sacred Texts",
          description:
            "Curated library of perennial wisdom and mandalist teachings.",
          href: "/community/resources",
        },
        {
          icon: Users,
          title: "Community Forum",
          description: "Connect with fellow members on your path.",
          href: "/community/sessions",
        },
      ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{programName}</h1>
          <p className="text-muted-foreground">
            Welcome, {member.full_name ?? "member"} · Member since{" "}
            {new Date(member.joined_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge
          variant={member.membership_status === "active" ? "default" : "secondary"}
        >
          {member.membership_status}
        </Badge>
      </div>

      {member.expires_at && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-3">
            <p className="text-sm text-amber-600">
              Membership expires{" "}
              {new Date(member.expires_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Profile Progress + Astro Charts ────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Profile Completion Progress Ring */}
        <ProfileProgressSection profilePct={profilePct} membersCount={otherMembers.length} />

        {/* Astro Charts polling/display */}
        <AstroChartsSection />
      </section>

      <Separator />

      {/* ── My Rituals ─────────────────────────────────────────────────────── */}
      {isPerennial && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              <h2 className="text-base font-semibold">My Rituals</h2>
              {rituals.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {rituals.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/community/rituals/new">+ Create Ritual</Link>
              </Button>
              {rituals.length > 0 && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/community/rituals">View All</Link>
                </Button>
              )}
            </div>
          </div>

          {rituals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/10">
                  <Flame className="size-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">No rituals yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create your first ritual invocation to get started.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/community/rituals/new">Create a Ritual</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {rituals.map((r) => (
                <Card
                  key={r.id}
                  className="transition-colors hover:border-primary/30"
                >
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{r.ritual_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link href={`/community/rituals/${r.id}`}>View →</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Relationships / Family Members ─────────────────────────────────── */}
      {isPerennial && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-rose-500" />
              <h2 className="text-base font-semibold">Family & Relationships</h2>
              {familyMembers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {familyMembers.length} member{familyMembers.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/community/family">Manage Family →</Link>
            </Button>
          </div>

          {familyMembers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">No family members added</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add family members to generate natal charts and compatibility reports.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href="/community/family">Add Member</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {familyMembers.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-600">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate uppercase">{m.full_name}</p>
                      {m.relationship && (
                        <p className="text-xs text-muted-foreground">{m.relationship}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-3">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/community/charts">
                      <TrendingUp className="mr-1.5 size-3.5" />
                      Explore Compatibility
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      )}

      {/* ── Members Connected ───────────────────────────────────────────────── */}
      {otherMembers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Community Members</h2>
            <Badge variant="outline" className="text-xs">
              {otherMembers.length}+ connected
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {(m.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium">{m.full_name ?? "Member"}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {m.membership_type === "mystery_school" ? "MS" : "PM"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* ── Content Counts ─────────────────────────────────────────────────── */}
      {Object.keys(contentCounts).length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Content Library</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(contentCounts).map(([type, count]) => (
              <Card key={type}>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {type.replace(/_/g, " ")}
                  </p>
                </CardContent>
              </Card>
            ))}
            {/* Blog posts count */}
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{recentBlog.length > 0 ? "+" : "0"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Blog Posts</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── Recent Spiritual Wisdom ────────────────────────────────────────── */}
      {recentWisdom.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              <h2 className="text-base font-semibold">Spiritual Wisdom</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/community/resources">View All →</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recentWisdom.map((item) => (
              <Card key={item.id} className="transition-colors hover:border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm leading-snug line-clamp-2">
                    {item.title}
                  </CardTitle>
                  {item.descriptive_title && (
                    <CardDescription className="text-xs line-clamp-1">
                      {item.descriptive_title}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.type ?? "text"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Blog Posts ──────────────────────────────────────────────── */}
      {recentBlog.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-blue-500" />
              <h2 className="text-base font-semibold">Latest Articles</h2>
            </div>
          </div>
          <div className="space-y-2">
            {recentBlog.map((post) => (
              <Card key={post.id} className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      {post.category && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {post.category}
                        </Badge>
                      )}
                      {post.published_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.published_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* ── Mystery School + Donation Promo Blocks ──────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Mystery School CTA */}
        {isPerennial && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-violet-500/10">
            <CardContent className="space-y-3 py-6">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base">Enter the Sacred Gateway</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The{" "}
                  <span className="font-medium text-foreground">
                    Mystery School
                  </span>{" "}
                  Grand Opening 2025 is here. Deepen your practice with the
                  12-week foundation and year-long decan curriculum.
                </p>
                <p className="mt-2 text-sm">
                  Join from just{" "}
                  <span className="font-bold text-primary">$10/month</span>.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/community/upgrade">Register for the Mystery School →</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mystery School nav for existing MS members */}
        {isMysterySchool && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/10">
            <CardContent className="space-y-3 py-6">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base">Continue Your Studies</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Access your Mystery School curriculum, decan work, and live training sessions.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/community/training">Go to Training →</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Donation CTA */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/10">
          <CardContent className="space-y-3 py-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
              <HandHeart className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-base">Support the Eternal Flame</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your generosity helps us maintain this sacred space, create new
                content, and support seekers on their path. Every contribution keeps
                the light burning.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <a href="https://divineinfinitebeing.com/donate" target="_blank" rel="noopener noreferrer">
                Donate Now ❤
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Feature Quick Links ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Explore</h2>
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
      </section>
    </div>
  );
}
