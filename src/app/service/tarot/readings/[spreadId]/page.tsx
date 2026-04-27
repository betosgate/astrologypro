import { redirect } from "next/navigation";
import { TarotSpreadReadingPage } from "@/app/admin/tarot/readings/[spreadId]/page";
import { requireAdminOrDiviner } from "@/lib/require-admin-or-diviner";

export default async function ServiceTarotSpreadReadingPage() {
  const user = await requireAdminOrDiviner();
  if (!user) redirect("/login?next=/service/tarot/readings");

  return <TarotSpreadReadingPage listHref="/dashboard/bookings" />;
}
