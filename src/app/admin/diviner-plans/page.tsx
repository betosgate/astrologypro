import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { DivinerPlansClient } from "@/components/admin/diviner-plans-client";

export const metadata = {
  title: "Diviner Plans — Admin",
};

export default async function DivinerPlansPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  return <DivinerPlansClient />;
}
