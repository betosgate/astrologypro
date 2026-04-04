import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import Link from "next/link";

export const metadata = { title: "Trainee Portal - AstrologyPro" };

export default async function TraineeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, name, username, training_status, onboarding_completed, mentor_diviner_id, graduated_at")
    .eq("user_id", user.id)
    .single();

  if (!trainee) redirect("/join/trainee");
  if (!trainee.onboarding_completed) redirect("/join/trainee?step=profile");

  const portals = await getUserPortals(supabase, user.id);

  const navLinks = [
    { label: "Dashboard", href: "/trainee" },
    { label: "Training", href: "/trainee/training" },
    { label: "Sessions", href: "/trainee/sessions" },
    { label: "Progress", href: "/trainee/progress" },
    { label: "Resources", href: "/trainee/resources" },
    ...(trainee.graduated_at ? [{ label: "Certificate", href: "/trainee/certificate" }] : []),
    { label: "Profile", href: "/trainee/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/trainee" className="text-lg font-bold">AstrologyPro</Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">Trainee Portal</span>
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
            <PortalSwitcher portals={portals} currentBase="/trainee" />
            <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
              Account
            </Link>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t px-4 sm:hidden">
          {navLinks.slice(0, 4).map((link) => (
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
