type ServiceLike = {
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  base_price?: number | null;
};

export function isFallbackManualService(service: ServiceLike | null | undefined): boolean {
  if (!service) return false;

  const name = (service.name ?? "").trim().toLowerCase();
  const slug = (service.slug ?? "").trim().toLowerCase();
  const category = (service.category ?? "").trim().toLowerCase();
  const price = Number(service.base_price ?? 0);

  return (
    name === "manual booking" ||
    slug.startsWith("manual-booking") ||
    (category === "freelance" && price === 0 && name.includes("manual"))
  );
}
