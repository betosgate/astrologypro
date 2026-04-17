interface ExpertiseItem {
  label: string;
  description?: string;
  icon?: string;
}

interface ExpertiseContent {
  heading?: string;
  subtitle?: string | null;
  display_style?: "tags" | "bullets" | "cards" | "icons";
  items?: ExpertiseItem[];
}

export function ExpertiseSection({ content }: { content: ExpertiseContent }) {
  const { heading, subtitle, display_style = "tags", items = [] } = content;
  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-2 font-display text-3xl font-semibold text-cream md:text-4xl">
            {heading}
          </h2>
        )}
        {subtitle && <p className="mb-6 text-silver/60">{subtitle}</p>}

        {display_style === "tags" && (
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <span
                key={i}
                className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5 text-sm font-medium text-gold/90"
              >
                {item.label}
              </span>
            ))}
          </div>
        )}

        {display_style === "bullets" && (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-cream/80">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold/60" />
                <span>
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="ml-2 text-silver/60">{item.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {display_style === "cards" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <p className="font-semibold text-cream">{item.label}</p>
                {item.description && (
                  <p className="mt-1 text-sm text-silver/60">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {display_style === "icons" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold text-lg">
                  {item.icon ?? "✦"}
                </div>
                <div>
                  <p className="font-semibold text-cream">{item.label}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-silver/60">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
