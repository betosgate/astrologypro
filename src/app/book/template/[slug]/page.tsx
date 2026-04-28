import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTemplateMatches } from "@/lib/booking/template-matched-services";
import { SharedTemplateCalendar } from "@/components/booking/shared-template-calendar";
import { APP_URL } from "@/lib/constants";
import { getBaseServiceTemplateSlug } from "@/lib/service-template-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submission?: string }>;
}

/**
 * Shared booking route for the `Book Without Choosing a Diviner` branch.
 *
 * Replaces the old `/book/demo?template=...&submission=...` fallback. The
 * user picks a date first; once a date is chosen, the client fetches the
 * ranked list of diviners available on that date. If exactly one diviner
 * is available, the UI can continue directly; if multiple, the user chooses
 * explicitly. The final booking is completed at `/{username}/book/{serviceSlug}`
 * with `?date=<YYYY-MM-DD>` plus `submission=<uuid>` when an intake exists, so
 * the existing booking wizard handles the real payment flow unchanged.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const [{ data: template }, match] = await Promise.all([
    admin
      .from("service_templates")
      .select("slug, name, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle(),
    resolveTemplateMatches(admin, slug),
  ]);
  if (!template || !match) return { title: "Booking not available" };
  const title = `Book ${template.name as string}`;
  return {
    title,
    description: `Pick a date and match with a compatible reader for your ${(template.name as string).toLowerCase()} session.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `${APP_URL}/services/${template.slug as string}` },
  };
}

export default async function SharedBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { submission } = await searchParams;
  const submissionId = submission?.trim() ?? "";

  const admin = createAdminClient();
  const [requestedTemplateRes, match, submissionRes] = await Promise.all([
    admin
      .from("service_templates")
      .select("slug, name, category, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle(),
    resolveTemplateMatches(admin, slug),
    submissionId
      ? admin
          .from("service_template_intake_submissions")
          .select(
            "id, template_slug, primary_birth_city, secondary_birth_city, area_of_inquiry, question, submitted_at",
          )
          .eq("id", submissionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const requestedTemplate = requestedTemplateRes.data;
  const sub = submissionRes.data;

  if (!requestedTemplate || !match) notFound();

  if (submissionId) {
    if (!sub) notFound();
    const storedSlug = (sub.template_slug as string | null) ?? "";
    if (getBaseServiceTemplateSlug(storedSlug) !== match.baseSlug) {
      notFound();
    }
  }

  const submissionSummary = sub
    ? {
        id: sub.id as string,
        primaryBirthCity: (sub.primary_birth_city as string | null) ?? null,
        secondaryBirthCity: (sub.secondary_birth_city as string | null) ?? null,
        areaOfInquiry: (sub.area_of_inquiry as string | null) ?? null,
        question: (sub.question as string | null) ?? null,
        submittedAt: sub.submitted_at as string,
      }
    : null;

  const templateHomePath = `/services/${encodeURIComponent(requestedTemplate.slug as string)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link mirrors the existing diviner booking page pattern */}
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
          <Link href={templateHomePath}>
            <ArrowLeft className="size-4" />
            Back to {requestedTemplate.name as string}
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">
            Book: {requestedTemplate.name as string}
          </h1>
          <p className="text-muted-foreground">
            Pick a date that works for you — we&rsquo;ll match you with a
            compatible reader who&rsquo;s available then.
          </p>
        </div>

        {match.diviners.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/8 px-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              No readers are currently offering this session
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              No certified readers have this reading enabled right now. Please
              check back soon, or pick a different reading from our services.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/services">Browse services</Link>
              </Button>
            </div>
          </div>
        ) : (
          <SharedTemplateCalendar
            templateSlug={requestedTemplate.slug as string}
            availabilitySlug={match.baseSlug}
            templateName={requestedTemplate.name as string}
            templateCategory={
              ((requestedTemplate.category as string) === "tarot"
                ? "tarot"
                : "astrology") as "astrology" | "tarot"
            }
            submissionId={submissionSummary?.id ?? null}
            submissionSummary={submissionSummary}
            submissionError={null}
            compatibleDivinerCount={match.diviners.length}
          />
        )}
      </div>
    </div>
  );
}
