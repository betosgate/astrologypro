import { redirect } from "next/navigation";

export default async function LegacyIngressChartDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/ingress-charts/${id}`);
}
