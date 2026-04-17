import Image from "next/image";

interface BioContent {
  heading?: string;
  body_html?: string;
  image_url?: string | null;
  image_position?: "left" | "right" | "top" | "background";
}

export function BioSection({ content }: { content: BioContent }) {
  const { heading, body_html, image_url, image_position = "left" } = content;

  const hasImage = !!image_url;
  const isHorizontal = hasImage && (image_position === "left" || image_position === "right");

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-8 font-display text-3xl font-semibold text-cream md:text-4xl">
            {heading}
          </h2>
        )}

        <div
          className={`flex gap-8 ${
            isHorizontal
              ? image_position === "left"
                ? "flex-col md:flex-row"
                : "flex-col md:flex-row-reverse"
              : "flex-col"
          } items-start`}
        >
          {hasImage && image_position !== "background" && (
            <div className="relative aspect-square w-full max-w-[240px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.06]">
              <Image
                src={image_url!}
                alt={heading ?? "Bio image"}
                fill
                className="object-cover"
                sizes="240px"
              />
            </div>
          )}

          {body_html && (
            <div
              className="prose prose-invert prose-sm max-w-none text-silver/70 leading-relaxed flex-1"
              dangerouslySetInnerHTML={{ __html: body_html }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
