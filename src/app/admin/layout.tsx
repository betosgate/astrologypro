import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RouteTracker } from "@/components/shared/route-tracker";
import { SectionContainer } from "@/components/shared/section-container";

export const metadata = {
  title: "Admin — AstrologyPro",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/admin" />
      <AdminSidebar />
      <main className="lg:pl-60">
        <SectionContainer size="wide" verticalPadding="md">
          {children}
        </SectionContainer>
      </main>
    </div>
  );
}
