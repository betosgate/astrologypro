import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">
              AstrologyPro
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
