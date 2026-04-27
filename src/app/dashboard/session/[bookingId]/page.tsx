import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open Service - AstrologyPro" };

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function DashboardSessionRouter({ params }: PageProps) {
  const { bookingId } = await params;
  redirect(`/service/session/${bookingId}`);
}
