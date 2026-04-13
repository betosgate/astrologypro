import { DashboardContentClient } from "@/components/admin/dashboard-content-client";
import {
  listAdminDashboardContent,
  listDashboardContentSources,
} from "@/lib/dashboard-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Content - Admin" };

export default async function AdminDashboardContentPage() {
  const [items, sourceOptions] = await Promise.all([
    listAdminDashboardContent(),
    listDashboardContentSources(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardContentClient
        initialItems={items}
        sourceOptions={sourceOptions}
      />
    </div>
  );
}
