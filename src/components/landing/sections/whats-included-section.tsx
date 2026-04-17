interface IncludedItem {
  text: string;
  icon?: string;
}

interface WhatsIncludedContent {
  heading?: string;
  items: IncludedItem[];
}

export function WhatsIncludedSection({ content }: { content: WhatsIncludedContent }) {
  const { heading, items } = content;
  if (!items || items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-6 font-display text-3xl font-semibold text-cream md:text-4xl">
            {heading}
          </h2>
        )}
        <div className="glass-card rounded-xl p-6">
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-cream/80">
                <span className="mt-0.5 text-gold">{item.icon ?? "✓"}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
