interface WhoItsForContent {
  heading?: string;
  description?: string | null;
  items: Array<{ text: string }>;
}

export function WhoItsForSection({ content }: { content: WhoItsForContent }) {
  const { heading, description, items } = content;
  if (!items || items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          {heading && (
            <p className="text-xs uppercase tracking-[0.24em] text-gold/70">
              {heading}
            </p>
          )}
          {description && (
            <p className="mt-2 text-silver/60 text-sm">{description}</p>
          )}
          <div className="mt-5 space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/8 bg-cosmos-950/40 px-4 py-3 text-sm text-cream/85"
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
