import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminAvailabilityClient } from "./admin-availability-client";

export const metadata = { title: "Availability — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  return <AdminAvailabilityClient />;
}
