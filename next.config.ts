import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
