import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "AstrologyPro - Run Your Divination Business",
    template: "%s | AstrologyPro",
  },
  description:
    "The all-in-one platform for astrologers and tarot readers. Get your own branded page, booking system, video sessions, and marketing tools.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://astrologypro.com"
  ),
  openGraph: {
    title: "AstrologyPro - Run Your Divination Business",
    description:
      "Everything astrologers and tarot readers need to run their business online.",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
