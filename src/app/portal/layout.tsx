import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";
import { PortalSwitcher } from "@/components/shared/portal-switcher";
import Link from "next/link";
import { PortalLogoutButton } from "@/components/portal/logout-button";

export const metadata = {
  title: "Client Portal",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Try to fetch existing client record
  let { data: client } = await supabase
    .from("clients")
    .select("id, full_name, email")
    .eq("user_id", user.id)
    .single();

  // If no client record, create one from auth user email
  if (!client) {
    const { data: newClient } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        email: user.email!,
        full_name: user.email!.split("@")[0],
      })
      .select("id, full_name, email")
      .single();

    client = newClient;
  }

  if (!client) redirect("/login");

  const portals = await getUserPortals(supabase, user.id);

  const navLinks = [
    { label: "Dashboard", href: "/portal" },
    { label: "Bookings", href: "/portal/bookings" },
    { label: "Profile", href: "/portal/profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="text-lg font-bold">
              AstrologyPro
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">My Portal</span>
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
            <PortalSwitcher portals={portals} currentBase="/portal" />
            <Link href="/account" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              Account
            </Link>
            <PortalLogoutButton />
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
