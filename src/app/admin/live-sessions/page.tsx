import { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { LiveSessionsClient } from "@/components/admin/live-sessions-client";

export const metadata: Metadata = {
  title: "Live Sessions | AstrologyPro Admin",
};

export default async function LiveSessionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f5f0e8" }}>
          Live Sessions
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
          Manage diviner live sessions and their check-in forms.
        </p>
      </div>
      <LiveSessionsClient />
    </div>
  );
}
