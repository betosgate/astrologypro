import { redirect } from "next/navigation";
import { HoroscopeToolkitPage } from "@/app/admin/horoscope/page";
import { requireAdminOrDiviner } from "@/lib/require-admin-or-diviner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Horoscope Toolkit - AstrologyPro" };

export default async function ServiceHoroscopePage() {
  const user = await requireAdminOrDiviner();
  if (!user) redirect("/login?next=/service/horoscope");

  return <HoroscopeToolkitPage basePath="/service/horoscope" />;
}
