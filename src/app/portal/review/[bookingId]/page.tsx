import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReviewToken } from "@/lib/review-token";
import { ReviewForm } from "./review-form";

interface PageProps {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Leave a Review - AstrologyPro",
};

export default async function ReviewPage({ params, searchParams }: PageProps) {
  const { bookingId } = await params;
  const { token } = await searchParams;

  // Verify token if provided (allows review without full login)
  if (token) {
    const result = verifyReviewToken(token);
    if (!result.valid || result.bookingId !== bookingId) {
      notFound();
    }
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, status, service_id, diviner_id, services(name), diviners(display_name, avatar_url, username)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) notFound();

  const diviner = booking.diviners as any;
  const service = booking.services as any;

  // Check if already reviewed — scoped to this specific booking
  const { data: existingReview } = await admin
    .from("testimonials")
    .select("id")
    .eq("booking_id", bookingId)
    .limit(1);

  const alreadyReviewed = (existingReview?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#06080f]">
      {/* Cosmic background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(88,28,135,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(201,168,76,0.08)_0%,transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-lg px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          {diviner?.avatar_url && (
            <img
              src={diviner.avatar_url}
              alt={diviner.display_name}
              className="mx-auto mb-4 size-20 rounded-full border-2 border-[#c9a84c]/30 object-cover"
            />
          )}
          <h1 className="font-display text-2xl font-semibold text-[#f5f0e8] md:text-3xl">
            How was your reading with {diviner?.display_name ?? "your reader"}?
          </h1>
          {service?.name && (
            <p className="mt-2 text-sm text-[#b8bcd0]/70">
              {service.name}
            </p>
          )}
        </div>

        {alreadyReviewed ? (
          <div className="rounded-2xl border border-[#c9a84c]/20 bg-[#0d1117]/80 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10">
              <span className="text-2xl">&#10003;</span>
            </div>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">
              Thank you for your review!
            </h2>
            <p className="mt-2 text-sm text-[#b8bcd0]/70">
              Your review will be published once approved.
            </p>
          </div>
        ) : (
          <ReviewForm
            bookingId={bookingId}
            divinerId={booking.diviner_id}
            divinerName={diviner?.display_name ?? "your reader"}
            serviceName={service?.name ?? "Session"}
          />
        )}
      </div>
    </div>
  );
}
