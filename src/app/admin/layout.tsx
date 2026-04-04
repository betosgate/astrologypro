import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RouteTracker } from "@/components/shared/route-tracker";

export const metadata = {
  title: "Admin — AstrologyPro",
};

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
      <RouteTracker href="/admin" />
      <AdminSidebar />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
