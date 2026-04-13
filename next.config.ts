import type { NextConfig } from "next";
import path from "path";

// build: 2026-04-03T09:30Z
const nextConfig: NextConfig = {
  // Skip type checking and linting during builds for speed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Admin training video uploads use Route Handlers with multipart/form-data.
    // The default buffered proxy/request-body limit is too small for lesson
    // videos, which truncates the body before `request.formData()` runs and
    // surfaces as "Invalid multipart/form-data body.".
    proxyClientMaxBodySize: "500mb",
  },
  // Exclude dev-only packages plus heavy server-only SDKs from the server
  // bundle. This keeps production builds from eagerly traversing large AWS
  // dependency graphs that are already available as installed runtime deps.
  serverExternalPackages: [
    "playwright-core",
    "playwright",
    "electron",
    "chromium-bidi",
    "@aws-sdk/client-chime-sdk-media-pipelines",
    "@aws-sdk/client-chime-sdk-meetings",
    "@aws-sdk/client-chime-sdk-voice",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-ses",
    "@aws-sdk/client-sts",
    "@aws-sdk/s3-request-presigner",
    "amazon-chime-sdk-js",
    "stripe",
  ],
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
