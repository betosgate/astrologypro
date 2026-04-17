interface FaqItem {
  question: string;
  answer: string;
}

interface FaqContent {
  heading?: string;
  items: FaqItem[];
}

export function FaqSection({ content }: { content: FaqContent }) {
  const { heading, items } = content;
  if (!items || items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4">
        {heading && (
          <h2 className="mb-8 text-center font-display text-3xl font-semibold text-cream md:text-4xl">
            {heading}
          </h2>
        )}
        <div className="space-y-4">
          {items.map((faq, i) => (
            <div key={i} className="glass-card rounded-xl p-5">
              <h3 className="mb-2 font-display text-base font-semibold text-cream">
                {faq.question}
              </h3>
              <p className="text-sm leading-relaxed text-silver/60">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
