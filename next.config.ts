import type { NextConfig } from "next";
import path from "path";

// build: 2026-04-03T09:30Z
const nextConfig: NextConfig = {
  // Exclude playwright and electron from the server bundle — they are dev-only
  // test dependencies and should never be bundled into the Next.js server.
  serverExternalPackages: ["playwright-core", "playwright", "electron", "chromium-bidi"],
  // Pin turbopack root to this project directory — prevents it picking up the
  // parent monorepo lockfile and resolving node_modules from the wrong location.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Ensure the Geist Bold TTF is bundled with the image-compositing Lambda.
  // readFileSync on a non-imported file is not auto-traced by Next.js bundler,
  // so without this the font file is absent at runtime on Vercel and text is blank.
  outputFileTracingIncludes: {
    "/api/mundane/image": [
      "./node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf",
    ],
  },
  webpack: (config) => {
    // Next.js detects divine/ as workspace root (parent package-lock.json).
    // Override context and resolve.modules to use this project's directory.
    config.context = path.resolve(__dirname);
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      "node_modules",
    ];
    return config;
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
