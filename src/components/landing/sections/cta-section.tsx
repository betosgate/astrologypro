import Link from "next/link";

interface CtaContent {
  heading: string;
  body_text?: string;
  button_label: string;
  button_url: string;
  button_style?: "primary" | "secondary" | "outline";
  background_color?: string | null;
  text_color?: string | null;
}

export function CtaSection({ content }: { content: CtaContent }) {
  const {
    heading,
    body_text,
    button_label,
    button_url,
    button_style = "primary",
    background_color,
    text_color,
  } = content;

  if (!heading || !button_url) return null;

  const buttonClass =
    button_style === "primary"
      ? "inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-cosmos-900 transition-all hover:bg-gold-light"
      : button_style === "secondary"
        ? "inline-flex h-11 items-center gap-2 rounded-lg bg-white/10 px-6 text-sm font-semibold text-cream transition-all hover:bg-white/15"
        : "inline-flex h-11 items-center gap-2 rounded-lg border border-gold px-6 text-sm font-semibold text-gold transition-all hover:bg-gold/5";

  return (
    <section
      className="py-12 md:py-16"
      style={{
        ...(background_color ? { backgroundColor: background_color } : {}),
        ...(text_color ? { color: text_color } : {}),
      }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
          {heading}
        </h2>
        {body_text && (
          <p className="mt-3 text-silver/70">{body_text}</p>
        )}
        <div className="mt-8">
          <Link href={button_url} className={buttonClass}>
            {button_label}
          </Link>
        </div>
      </div>
    </section>
  );
}
