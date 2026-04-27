import {
  TarotSpreadReadingPage,
} from "@/app/admin/tarot/readings/[spreadId]/page";

export default function DashboardTarotSpreadReadingPage() {
  return <TarotSpreadReadingPage listHref="/dashboard/bookings" />;
}
