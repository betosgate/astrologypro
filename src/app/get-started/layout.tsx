import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started - Create Your Astrologer Profile | AstrologyPro",
  description:
    "Create your free AstrologyPro account. Set up your branded astrology or tarot reader page in minutes.",
  openGraph: {
    title: "Create Your Astrologer Profile | AstrologyPro",
    description:
      "Join AstrologyPro and get your own branded page, booking system, video sessions, and payment processing — all in one platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your Astrologer Profile | AstrologyPro",
    description:
      "Join AstrologyPro and get your own branded page, booking system, video sessions, and payment processing — all in one platform.",
  },
};

export default function GetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
