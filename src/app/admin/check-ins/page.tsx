import { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { CheckInsClient } from "@/components/admin/check-ins-client";

export const metadata: Metadata = {
  title: "Check-ins | AstrologyPro Admin",
};

export default async function CheckInsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f5f0e8" }}>
          Check-ins
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.6)" }}>
          Leads captured from live session check-in forms.
        </p>
      </div>
      <CheckInsClient />
    </div>
  );
}
