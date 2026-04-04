import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserPortals } from "@/lib/user-roles";

export const metadata = { title: "My Account - AstrologyPro" };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const portals = await getUserPortals(supabase, user.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold">AstrologyPro</Link>
            <span className="text-sm text-muted-foreground">My Account</span>
          </div>
          <div className="flex items-center gap-2">
            {portals.length === 1 && (
              <Link
                href={portals[0].href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← {portals[0].label}
              </Link>
            )}
            {portals.length > 1 && (
              <Link
                href="/switch"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← My Portals
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl p-4 py-8">
        {children}
      </main>
    </div>
  );
}
