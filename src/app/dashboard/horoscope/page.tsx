import {
  HoroscopeToolkitPage,
} from "@/app/admin/horoscope/page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Horoscope Toolkit - AstrologyPro" };

export default function DashboardHoroscopePage() {
  return <HoroscopeToolkitPage basePath="/dashboard/horoscope" />;
}
