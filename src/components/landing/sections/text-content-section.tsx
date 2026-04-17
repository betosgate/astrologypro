interface TextContentContent {
  heading?: string;
  subtitle?: string | null;
  body_html: string;
  text_alignment?: "left" | "center" | "right";
  background_color?: string | null;
}

export function TextContentSection({ content }: { content: TextContentContent }) {
  const { heading, subtitle, body_html, text_alignment = "left", background_color } = content;
  if (!body_html) return null;

  const alignClass = text_alignment === "center" ? "text-center" : text_alignment === "right" ? "text-right" : "text-left";

  return (
    <section
      className="py-12 md:py-16"
      style={background_color ? { backgroundColor: background_color } : undefined}
    >
      <div className={`mx-auto max-w-3xl px-4 ${alignClass}`}>
        {heading && (
          <h2 className="mb-2 font-display text-3xl font-semibold text-cream">
            {heading}
          </h2>
        )}
        {subtitle && (
          <p className="mb-6 text-silver/60">{subtitle}</p>
        )}
        <div
          className="prose prose-invert prose-sm max-w-none text-silver/70 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: body_html }}
        />
      </div>
    </section>
  );
}
