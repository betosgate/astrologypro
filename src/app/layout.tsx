import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com").trim();
const OG_IMAGE = `${BASE_URL}/images/home/og-card.jpg`;

export const metadata: Metadata = {
  title: {
    default: "AstrologyPro - Run Your Divination Business",
    template: "%s | AstrologyPro",
  },
  description:
    "The all-in-one platform for astrologers and tarot readers. Get your own branded page, booking system, video sessions, and marketing tools.",
  keywords: [
    "astrology platform",
    "tarot reader software",
    "online astrology business",
    "astrology booking system",
    "tarot reading platform",
    "divination business tools",
    "astrologer website builder",
    "video astrology readings",
    "tarot business software",
    "horoscope readings online",
    "natal chart readings",
    "professional astrology tools",
    "book an astrologer",
    "tarot card meanings",
    "zodiac signs",
  ],
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
  openGraph: {
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "Everything astrologers and tarot readers need to run their business online.",
    type: "website",
    siteName: "AstrologyPro",
    url: BASE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "AstrologyPro - The platform for professional astrologers and tarot readers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "The all-in-one platform for astrologers and tarot readers to run their business online.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="cosmic-bg noise-overlay min-h-screen bg-background font-sans text-foreground antialiased"
      >
        {/* Global page-transition progress bar — amber to match brand */}
        <NextTopLoader
          color="#f59e0b"
          initialPosition={0.12}
          crawlSpeed={180}
          height={3}
          crawl
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 10px #f59e0b, 0 0 5px #d97706"
          zIndex={9999}
        />
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
