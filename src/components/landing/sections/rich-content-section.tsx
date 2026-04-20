interface RichContentContent {
  heading?: string;
  body_html: string;
  layout?: "full" | "two-column" | "sidebar-left" | "sidebar-right";
  sidebar_content_html?: string | null;
}

export function RichContentSection({ content }: { content: RichContentContent }) {
  const { heading, body_html, layout = "full", sidebar_content_html } = content;
  if (!body_html) return null;

  const hasSidebar = !!sidebar_content_html && layout !== "full" && layout !== "two-column";

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-6 font-display text-3xl font-semibold text-cream">
            {heading}
          </h2>
        )}

        {layout === "full" && (
          <div
            className="prose prose-invert prose-sm max-w-none text-silver/70 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: body_html }}
          />
        )}

        {layout === "two-column" && (
          <div className="grid gap-8 md:grid-cols-2">
            <div
              className="prose prose-invert prose-sm max-w-none text-silver/70"
              dangerouslySetInnerHTML={{ __html: body_html }}
            />
            {sidebar_content_html && (
              <div
                className="prose prose-invert prose-sm max-w-none text-silver/70"
                dangerouslySetInnerHTML={{ __html: sidebar_content_html }}
              />
            )}
          </div>
        )}

        {hasSidebar && (
          <div
            className={`grid gap-8 md:grid-cols-[1fr_280px] ${layout === "sidebar-right" ? "" : "md:grid-cols-[280px_1fr]"}`}
          >
            {layout === "sidebar-left" && sidebar_content_html && (
              <aside
                className="prose prose-invert prose-sm max-w-none text-silver/70 glass-card rounded-xl p-5"
                dangerouslySetInnerHTML={{ __html: sidebar_content_html }}
              />
            )}
            <div
              className="prose prose-invert prose-sm max-w-none text-silver/70"
              dangerouslySetInnerHTML={{ __html: body_html }}
            />
            {layout === "sidebar-right" && sidebar_content_html && (
              <aside
                className="prose prose-invert prose-sm max-w-none text-silver/70 glass-card rounded-xl p-5"
                dangerouslySetInnerHTML={{ __html: sidebar_content_html }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
