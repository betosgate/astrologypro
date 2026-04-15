import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardMundaneEntityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/community/mundane/${id}`);
}
