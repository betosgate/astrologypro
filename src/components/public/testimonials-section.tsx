import { createAdminClient } from "@/lib/supabase/admin";
import { TestimonialFormToggle } from "./testimonial-form-toggle";

interface Props {
  divinerId: string;
  divinerUsername: string;
  divinerName: string;
}

interface TestimonialRow {
  id: string;
  display_alias: string | null;
  client_name: string | null;
  rating: number | null;
  text: string;
  service_name: string | null;
  service_type: string | null;
  is_featured: boolean;
  created_at: string;
}

function fmtMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= rating ? "text-[#c9a84c]" : "text-silver/20"}
          aria-hidden
        >
          {s <= rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function displayName(row: TestimonialRow): string {
  if (row.display_alias) return row.display_alias;
  if (row.client_name) {
    // client_name stores submitter email for public submissions — don't expose
    const n = row.client_name;
    if (n.includes("@")) return "A client";
    return n.split(" ")[0];
  }
  return "A client";
}

function TestimonialCard({
  t,
  featured,
}: {
  t: TestimonialRow;
  featured: boolean;
}) {
  const svc = t.service_name ?? t.service_type;
  return (
    <article
      className={`rounded-xl p-5 flex flex-col gap-3 ${
        featured
          ? "border border-gold/30 bg-gradient-to-br from-cosmos-800/80 to-cosmos-900/60"
          : "border border-white/8 bg-cosmos-800/40"
      }`}
    >
      {featured && (
        <span
          className="self-start text-xs font-medium text-gold/80 bg-gold/10 border border-gold/20 rounded-full px-2.5 py-0.5 flex items-center gap-1"
          aria-label="Featured testimonial"
        >
          <span aria-hidden>✨</span> Featured
        </span>
      )}
      {t.rating && (
        <div>
          <Stars rating={t.rating} />
        </div>
      )}
      <blockquote className="text-sm leading-relaxed text-silver/80 flex-1">
        &ldquo;{t.text}&rdquo;
      </blockquote>
      <footer className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-medium text-cream/90">
            {displayName(t)}
          </p>
          {svc && (
            <span className="inline-block mt-0.5 text-xs text-silver/50 border border-white/10 rounded-full px-2 py-0.5">
              {svc}
            </span>
          )}
        </div>
        <time
          dateTime={t.created_at}
          className="text-xs text-silver/40 shrink-0"
        >
          {fmtMonthYear(t.created_at)}
        </time>
      </footer>
    </article>
  );
}

export async function TestimonialsSection({
  divinerId,
  divinerUsername,
  divinerName,
}: Props) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("testimonials")
    .select(
      "id, display_alias, client_name, rating, text, service_name, service_type, is_featured, created_at"
    )
    .eq("diviner_id", divinerId)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  const testimonials = (data ?? []) as TestimonialRow[];
  const featured = testimonials.filter((t) => t.is_featured);
  const regular = testimonials.filter((t) => !t.is_featured);

  // `id="reviews"` matches the StickyNav anchor so clicking the
  // "Reviews" nav button scrolls here. The legacy `#testimonials`
  // anchor is preserved as an inner span below for back-compat with
  // any old shared links.
  return (
    <section id="reviews" className="py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        {/* Back-compat anchor for any links that pointed at the old
            #testimonials id before this section was renamed to #reviews. */}
        <span id="testimonials" aria-hidden className="block h-0 w-0" />
        <h2 className="mb-2 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
          What Clients Are Saying
        </h2>
        <p className="mx-auto mb-10 max-w-md text-center text-sm text-silver/60">
          Real experiences from people who have worked with {divinerName}
        </p>

        {testimonials.length > 0 && (
          <>
            {/* Featured testimonials */}
            {featured.length > 0 && (
              <div className="mb-8 grid gap-5 sm:grid-cols-2">
                {featured.map((t) => (
                  <TestimonialCard key={t.id} t={t} featured />
                ))}
              </div>
            )}

            {/* Regular testimonials grid */}
            {regular.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {regular.map((t) => (
                  <TestimonialCard key={t.id} t={t} featured={false} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Share your experience CTA */}
        <div className="mt-10 flex justify-center">
          <TestimonialFormToggle
            divinerUsername={divinerUsername}
            divinerId={divinerId}
            divinerName={divinerName}
          />
        </div>
      </div>

      <div className="cosmic-divider mx-auto mt-10 max-w-6xl md:mt-14" />
    </section>
  );
}
