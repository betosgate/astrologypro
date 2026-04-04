import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import Link from "next/link";

export const metadata = { title: "Community - AstrologyPro" };

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, full_name, membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  const portals = await getUserPortals(supabase, user.id);
  const membershipLabel = member.membership_type === "mystery_school" ? "Mystery School" : "Perennial Mandalism";

  const isMysterySchool = member.membership_type === "mystery_school";

  const navLinks = [
    { label: "Home", href: "/community" },
    { label: "Sessions", href: "/community/sessions" },
    { label: "Resources", href: "/community/resources" },
    ...(member.membership_type !== "mystery_school" ? [
      { label: "Family", href: "/community/family" },
      { label: "Charts", href: "/community/charts" },
      { label: "Transits", href: "/community/transits" },
      { label: "Rituals", href: "/community/rituals" },
    ] : []),
    ...(isMysterySchool ? [
      { label: "Training", href: "/community/training" },
      { label: "Decans", href: "/community/decans" },
    ] : []),
    { label: "Ingress Charts", href: "/community/ingress-charts" },
    { label: "Horoscope", href: "/community/horoscope" },
    { label: "Service", href: "/community/sunday-service" },
    { label: "Library", href: "/community/library" },
    { label: "Profile", href: "/community/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/community" className="text-lg font-bold">AstrologyPro</Link>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary sm:inline">
              {membershipLabel}
            </span>
            <nav className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <PortalSwitcher portals={portals} currentBase="/community" />
            <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
              Account
            </Link>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t px-4 sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container mx-auto max-w-5xl p-4 py-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
