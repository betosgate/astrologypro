import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com"
  ),
  alternates: {
    canonical: "https://astrologypro.com",
  },
  openGraph: {
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "Everything astrologers and tarot readers need to run their business online.",
    type: "website",
    siteName: "AstrologyPro",
  },
  twitter: {
    card: "summary_large_image",
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "The all-in-one platform for astrologers and tarot readers to run their business online.",
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
      <body className="cosmic-bg noise-overlay min-h-screen bg-background font-sans text-foreground antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
