import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the Geist Bold TTF is bundled with the image-compositing Lambda.
  // readFileSync on a non-imported file is not auto-traced by Next.js bundler,
  // so without this the font file is absent at runtime on Vercel and text is blank.
  outputFileTracingIncludes: {
    "/api/mundane/image": [
      "./node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf",
    ],
  },
  async headers() {
    return [
      {
        // Share pages are public — override Vercel's private/no-cache so
        // Facebook, LinkedIn, and WhatsApp scrapers can read the og:image/title.
        source: "/share/:token",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Composited images: long-lived public cache
        source: "/api/mundane/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // OG metadata for social crawlers — short-lived public cache (matches the share page TTL)
        source: "/api/share-og",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
