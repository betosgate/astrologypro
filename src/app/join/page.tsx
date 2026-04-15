import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Share2, Users, BookOpen, GraduationCap, Sparkles } from "lucide-react";

const paths = [
  {
    icon: Star,
    title: "Diviner",
    description: "Offer astrology, tarot, and divination readings. Build your practice with bookings, client management, and marketing tools.",
    cta: "Start Your Practice",
    href: "/get-started",
    highlight: true,
  },
  {
    icon: Sparkles,
    title: "Client",
    description: "Book a reading with one of our gifted practitioners. Explore the diviners and find the right guide for you.",
    cta: "Find a Reader",
    href: "/discover",
  },
  {
    icon: GraduationCap,
    title: "Trainee",
    description: "Apprentice under an experienced diviner mentor. Learn the craft with structured guidance and practice readings.",
    cta: "Join as Trainee",
    href: "/join/trainee",
  },
  {
    icon: Share2,
    title: "Social Advocate",
    description: "Share the magic of AstrologyPro and earn 10% commission on every booking you refer. Free to join.",
    cta: "Become an Advocate",
    href: "/join/advocate",
  },
  {
    icon: BookOpen,
    title: "Mystery School",
    description: "A structured learning path — courses, live classes, and mentored readings for those called to master the esoteric arts.",
    cta: "Apply to Mystery School",
    href: "/join/mystery-school",
  },
  {
    icon: Users,
    title: "Perennial Mandalism",
    description: "A living tradition of cosmic wisdom, sacred geometry, and ceremony. Join our community of dedicated practitioners.",
    cta: "Join the Circle",
    href: "/get-started",
  },
];

export const metadata = { title: "Join AstrologyPro" };

export default async function JoinPage() {
  // Redirect authenticated users to their correct portal
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const adminUser = await requireAdmin().catch(() => null);
    const admin = createAdminClient();
    const destination = await resolveLoginDestination({
      userId: user.id,
      isAdmin: !!adminUser,
      isInvited: user.user_metadata?.invited_by_admin === true,
      adminClient: admin,
    });
    redirect(destination);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-16">
        <div className="w-full max-w-5xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Choose Your Path</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              AstrologyPro serves every role in the divination community. Select what fits you best.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => {
              const Icon = p.icon;
              return (
                <Card
                  key={p.title}
                  className={`flex flex-col transition-colors hover:border-primary/40 ${p.highlight ? "border-primary/30 bg-primary/5" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <CardTitle>{p.title}</CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <Button
                      asChild
                      className="w-full"
                      variant={p.highlight ? "default" : "outline"}
                    >
                      <Link href={p.href}>{p.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
