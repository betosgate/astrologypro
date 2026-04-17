import Image from "next/image";
import Link from "next/link";

interface ImageBannerContent {
  image_url: string;
  alt_text?: string;
  caption?: string | null;
  link_url?: string | null;
  aspect_ratio?: "16:9" | "4:3" | "1:1" | "auto";
  full_width?: boolean;
}

const aspectClasses: Record<string, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  auto: "",
};

export function ImageBannerSection({ content }: { content: ImageBannerContent }) {
  const { image_url, alt_text, caption, link_url, aspect_ratio = "16:9", full_width = false } = content;
  if (!image_url) return null;

  const wrapper = (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] ${aspectClasses[aspect_ratio] ?? "aspect-video"}`}>
      <Image
        src={image_url}
        alt={alt_text ?? ""}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 896px"
      />
    </div>
  );

  return (
    <section className="py-8 md:py-12">
      <div className={full_width ? "" : "mx-auto max-w-4xl px-4"}>
        {link_url ? (
          <Link href={link_url} target="_blank" rel="noopener noreferrer">
            {wrapper}
          </Link>
        ) : (
          wrapper
        )}
        {caption && (
          <p className="mt-3 text-center text-sm text-silver/50">{caption}</p>
        )}
      </div>
    </section>
  );
}
