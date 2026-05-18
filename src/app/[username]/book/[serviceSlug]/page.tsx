import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { APP_URL } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { applyRuntimePricesToServices } from "@/lib/runtime-service-pricing";
import { canPubliclySellService } from "@/lib/payout-readiness";
import {
  getBaseServiceTemplateSlug,
  normalizeServiceTemplateIntakeState,
} from "@/lib/service-template-form";

interface PageProps {
  params: Promise<{ username: string; serviceSlug: string }>;
  /**
   * `ref` — optional referrer/campaign tag (pre-existing).
   * `submission` — intake submission uuid, carried here from
   *   /book/template/[slug] when the user used the "Book Without Choosing
   *   a Diviner" flow. Preserved so future toolkit / booking modules can
   *   tie the final booking back to the saved intake.
   * `date` — optional preselected date (YYYY-MM-DD) from the shared
   *   calendar flow. Passed to the BookingWizard so the calendar can
   *   jump straight to the right month.
   * `time` — optional selected UTC slot from the shared calendar flow.
   *   Paired with date to start the wizard on the Contact step.
   * `template` — optional original public template slug. For general
   *   templates, this lets the final booking page preserve the product label
   *   while still booking the canonical diviner service.
   * `discount_token` — optional Perennial member discount token carried from
   *   /services through the shared calendar into payment setup.
   * `source` — optional source marker. `community` means the final booking
   *   must be owned by the logged-in Community account.
   */
  searchParams: Promise<{
    ref?: string;
    submission?: string;
    date?: string;
    time?: string;
    template?: string;
    discount_token?: string;
    source?: string;
  }>;
}

function getCommunitySource(value: string | undefined): "community" | null {
  return value?.trim() === "community" ? "community" : null;
}

function buildBookingRedirectPath(
  username: string,
  serviceSlug: string,
  params: {
    ref?: string | null;
    submission?: string | null;
    date?: string | null;
    time?: string | null;
    template?: string | null;
    discountToken?: string | null;
    source?: "community" | null;
  },
) {
  const search = new URLSearchParams();
  if (params.ref) search.set("ref", params.ref);
  if (params.submission) search.set("submission", params.submission);
  if (params.date) search.set("date", params.date);
  if (params.time) search.set("time", params.time);
  if (params.template) search.set("template", params.template);
  if (params.discountToken) search.set("discount_token", params.discountToken);
  if (params.source) search.set("source", params.source);

  const query = search.toString();
  return `/${encodeURIComponent(username)}/book/${encodeURIComponent(serviceSlug)}${
    query ? `?${query}` : ""
  }`;
}

async function getDivinerAndService(username: string, serviceSlug: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, username, display_name, avatar_url, timezone, stripe_account_id, charges_enabled, payouts_enabled")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (!diviner) return { diviner: null, service: null };

  const { data: service } = await supabase
    .from("services")
    .select("id, name, slug, description, duration_minutes, base_price, pricing_item_key, category, requires_birth_data, intake_template_id, product_kind, is_subscription, requires_birth_time, requires_birth_city, requires_partner_data, pre_checkout_fields, post_checkout_fields, template_id")
    .eq("diviner_id", diviner.id)
    .eq("slug", serviceSlug)
    .eq("is_active", true)
    .single();

  // Task 05: enforce template access control — block booking if not published
  if (service?.template_id) {
    const { data: ds } = await admin
      .from("diviner_services")
      .select("is_enabled, is_published")
      .eq("diviner_id", diviner.id)
      .eq("template_id", service.template_id)
      .maybeSingle();
    if (!ds || !ds.is_enabled || !ds.is_published) {
      // Return service as null to trigger "Service unavailable" path
      return { diviner, service: null };
    }
  }

  const [resolvedService] = await applyRuntimePricesToServices(
    supabase,
    service ? [service] : []
  );

  const base = resolvedService ?? service;
  if (!base) return { diviner, service: null };

  // Use the availability template's duration_minutes if one is linked to this service,
  // so the booking page reflects the actual scheduled session length.
  const { data: template } = await admin
    .from("availability_templates")
    .select("duration_minutes")
    .or(`owner_id.eq.${diviner.id},diviner_id.eq.${diviner.id}`)
    .eq("service_id", base.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const duration = template?.duration_minutes ?? base.duration_minutes;

  return { diviner, service: { ...base, duration_minutes: duration } };
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

export default async function BookingPage({ params, searchParams }: PageProps) {
  const { username, serviceSlug } = await params;
  const { ref, submission, date, time, template, discount_token, source } = await searchParams;
  const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const submissionId = submission?.trim() || null;
  const templateParam = template?.trim() || null;
  const discountToken = discount_token?.trim() || null;
  const bookingSource = getCommunitySource(source);
  const preselectedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date.trim()) ? date.trim() : null;
  const preselectedTime =
    time && Number.isFinite(new Date(time).getTime()) ? time : null;
  const startOnContact = Boolean(preselectedDate && preselectedTime);
  const { diviner, service } = await getDivinerAndService(username, serviceSlug);

  if (!diviner || !service) {
    notFound();
  }

  let lockedEmail: string | null = null;
  if (bookingSource === "community") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const authEmail = user?.email?.trim().toLowerCase() ?? null;

    if (!user || !authEmail) {
      const redirectPath = buildBookingRedirectPath(username, serviceSlug, {
        ref: ref ?? null,
        submission: submissionId,
        date: preselectedDate,
        time: preselectedTime,
        template: templateParam,
        discountToken,
        source: bookingSource,
      });
      redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }

    const { data: member } = await supabase
      .from("community_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      redirect("/get-started");
    }

    lockedEmail = authEmail;
  }

  let bookingDisplayName = service.name as string;
  let intakePrefill: {
    birthDate?: string;
    birthTime?: string;
    birthCity?: string;
    birthLat?: number | null;
    birthLng?: number | null;
    birthTimezone?: string;
    notes?: string;
  } | null = null;

  if (submissionId) {
    const admin = createAdminClient();
    const [{ data: intake }, { data: serviceTemplate }] = await Promise.all([
      admin
        .from("service_template_intake_submissions")
        .select("id, template_slug, template_name, payload, area_of_inquiry, question")
        .eq("id", submissionId)
        .maybeSingle(),
      service.template_id
        ? admin
            .from("service_templates")
            .select("slug")
            .eq("id", service.template_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!intake || !serviceTemplate) {
      notFound();
    }

    const intakeBaseSlug = getBaseServiceTemplateSlug(
      (intake.template_slug as string | null) ?? "",
    );
    const serviceBaseSlug = getBaseServiceTemplateSlug(
      (serviceTemplate.slug as string | null) ?? "",
    );
    if (intakeBaseSlug !== serviceBaseSlug) {
      notFound();
    }
    if (
      templateParam &&
      getBaseServiceTemplateSlug(templateParam) !== intakeBaseSlug
    ) {
      notFound();
    }

    bookingDisplayName =
      (intake.template_name as string | null) || bookingDisplayName;

    const normalizedIntake = normalizeServiceTemplateIntakeState(intake.payload);
    if (normalizedIntake) {
      const city = normalizedIntake.person1.city;
      intakePrefill = {
        birthDate: normalizedIntake.person1.dob || undefined,
        birthTime: normalizedIntake.person1.tob || undefined,
        birthCity: city?.label || undefined,
        birthLat: city?.lat ?? null,
        birthLng: city?.lng ?? null,
        birthTimezone:
          city?.timezone.name || city?.timezone.utcOffset || city?.timezone.offset_string || undefined,
      };
    }
  }

  const bookingEnabled = canPubliclySellService(service, diviner);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
          <Link href={`/${username}${refParam}`}>
            <ArrowLeft className="size-4" />
            Back to {diviner.display_name}
          </Link>
        </Button>

        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">
            Book: {bookingDisplayName}
          </h1>
          <p className="text-muted-foreground">
            {service.duration_minutes}-minute session with{" "}
            {diviner.display_name}
          </p>
        </div>

        {bookingEnabled ? (
          <BookingWizard
            diviner={diviner}
            service={service}
            availabilityServiceId={service.id}
            bookingLabel={bookingDisplayName}
            submissionId={submissionId}
            intakePrefill={intakePrefill}
            preselectedDate={preselectedDate}
            startOnContact={startOnContact}
            discountToken={discountToken}
            bookingSource={bookingSource}
            lockedEmail={lockedEmail}
          />
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/8 px-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Booking Temporarily Unavailable
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This paid service is temporarily unavailable while payment setup is being completed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
