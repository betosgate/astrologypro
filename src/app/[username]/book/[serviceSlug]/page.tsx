import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { APP_URL } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string; serviceSlug: string }>;
}

async function getDivinerAndService(username: string, serviceSlug: string) {
  const supabase = await createClient();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, username, display_name, avatar_url, timezone")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (!diviner) return { diviner: null, service: null };

  const { data: service } = await supabase
    .from("services")
    .select("id, name, slug, description, duration_minutes, base_price, category, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields")
    .eq("diviner_id", diviner.id)
    .eq("slug", serviceSlug)
    .eq("is_active", true)
    .single();

  return { diviner, service };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, serviceSlug } = await params;
  const { diviner, service } = await getDivinerAndService(username, serviceSlug);

  if (!diviner || !service) {
    return { title: "Not Found" };
  }

  const title = `Book ${service.name} with ${diviner.display_name}`;
  const description =
    service.description ??
    `Book a ${service.duration_minutes}-minute ${service.name} reading with ${diviner.display_name}`;

  // Booking pages are conversion utilities — keep them out of the search index
  // so they do not compete with service detail pages for purchase-intent queries.
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${APP_URL}/${username}/services/${serviceSlug}` },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${username}/book/${serviceSlug}`,
      type: "website",
    },
  };
}

export default async function BookingPage({ params }: PageProps) {
  const { username, serviceSlug } = await params;
  const { diviner, service } = await getDivinerAndService(username, serviceSlug);

  if (!diviner || !service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
          <Link href={`/${username}`}>
            <ArrowLeft className="size-4" />
            Back to {diviner.display_name}
          </Link>
        </Button>

        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">
            Book: {service.name}
          </h1>
          <p className="text-muted-foreground">
            {service.duration_minutes}-minute session with{" "}
            {diviner.display_name}
          </p>
        </div>

        {/* Booking Wizard */}
        <BookingWizard
          diviner={diviner}
          service={service}
          availabilityServiceId={service.id}
          bookingLabel={service.name}
        />
      </div>
    </div>
  );
}
