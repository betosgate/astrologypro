import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { APP_URL } from "@/lib/constants";
import { isFallbackManualService } from "@/lib/public-booking";
import { createClient } from "@/lib/supabase/server";
import { applyRuntimePricesToServices } from "@/lib/runtime-service-pricing";
import { canPubliclySellService } from "@/lib/payout-readiness";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getDivinerAndBookingContext(username: string) {
  const supabase = await createClient();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, username, display_name, avatar_url, timezone, stripe_account_id, charges_enabled, payouts_enabled")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (!diviner) {
    return {
      diviner: null,
      bookingService: null,
      usingFallbackBooking: false,
      hasBlockedPaidServices: false,
    };
  }

  const { data: services } = await supabase
    .from("services")
    .select("id, name, slug, description, duration_minutes, base_price, pricing_item_key, category, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields, is_featured, sort_order")
    .eq("diviner_id", diviner.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  const activeServices = await applyRuntimePricesToServices(supabase, services ?? []);
  const publicServices = activeServices.filter((service) => !isFallbackManualService(service));
  const fallbackService =
    activeServices.find((service) => isFallbackManualService(service)) ?? null;
  const sellableFallbackService =
    fallbackService && canPubliclySellService(fallbackService, diviner)
      ? fallbackService
      : null;
  const sellablePublicServices = publicServices.filter((service) =>
    canPubliclySellService(service, diviner)
  );
  const hasBlockedPaidServices = activeServices.some(
    (service) => !canPubliclySellService(service, diviner)
  );
  const bookingService = sellablePublicServices[0] ?? sellableFallbackService;
  const usingFallbackBooking =
    !!bookingService && sellablePublicServices.length === 0 && isFallbackManualService(bookingService);

  return { diviner, bookingService, usingFallbackBooking, hasBlockedPaidServices };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { diviner, bookingService, usingFallbackBooking, hasBlockedPaidServices } =
    await getDivinerAndBookingContext(username);

  if (!diviner) {
    return { title: "Not Found" };
  }

  if (!bookingService) {
    return hasBlockedPaidServices
      ? {
          title: `Booking Temporarily Unavailable | ${diviner.display_name}`,
          description: `${diviner.display_name} is completing payment setup for paid bookings.`,
        }
      : { title: "Not Found" };
  }

  const title = usingFallbackBooking
    ? `Book a Reading with ${diviner.display_name}`
    : `Book ${bookingService.name} with ${diviner.display_name}`;
  const description = usingFallbackBooking
    ? `Choose an available time to book a reading with ${diviner.display_name}`
    : bookingService.description ??
      `Book a ${bookingService.duration_minutes}-minute ${bookingService.name} reading with ${diviner.display_name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${username}/book`,
      type: "website",
    },
  };
}

export default async function GenericBookingPage({ params }: PageProps) {
  const { username } = await params;
  const { diviner, bookingService, usingFallbackBooking, hasBlockedPaidServices } =
    await getDivinerAndBookingContext(username);

  if (!diviner) {
    notFound();
  }

  if (!bookingService && !hasBlockedPaidServices) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
          <Link href={`/${username}`}>
            <ArrowLeft className="size-4" />
            Back to {diviner.display_name}
          </Link>
        </Button>

        {bookingService ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold md:text-3xl">
                {usingFallbackBooking ? "Book a Reading" : `Book: ${bookingService.name}`}
              </h1>
              <p className="text-muted-foreground">
                {usingFallbackBooking
                  ? `Choose the next available time with ${diviner.display_name}`
                  : `${bookingService.duration_minutes}-minute session with ${diviner.display_name}`}
              </p>
            </div>

            <BookingWizard
              diviner={diviner}
              service={bookingService}
              availabilityServiceId={usingFallbackBooking ? null : bookingService.id}
              bookingLabel={usingFallbackBooking ? "Reading Session" : bookingService.name}
              hideServiceName={usingFallbackBooking}
            />
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/8 px-6 py-8 text-center">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Booking Temporarily Unavailable
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This diviner is completing payment setup for paid bookings. Please check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
