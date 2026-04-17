import Image from "next/image";

interface GalleryImage {
  url: string;
  alt_text?: string;
  caption?: string;
}

interface GalleryContent {
  heading?: string | null;
  display_style?: "grid" | "carousel" | "masonry";
  columns?: number;
  images: GalleryImage[];
}

export function GallerySection({ content }: { content: GalleryContent }) {
  const { heading, columns = 3, images } = content;
  if (!images || images.length === 0) return null;

  const colClass =
    columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {heading && (
          <h2 className="mb-6 font-display text-3xl font-semibold text-cream">
            {heading}
          </h2>
        )}
        <div className={`grid gap-3 ${colClass}`}>
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.06]">
              <Image
                src={img.url}
                alt={img.alt_text ?? ""}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cosmos-900/80 to-transparent p-3 translate-y-full transition-transform group-hover:translate-y-0">
                  <p className="text-xs text-cream">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
