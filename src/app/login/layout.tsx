import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — AstrologyPro",
  description:
    "Sign in to your AstrologyPro account to access your dashboard, bookings, and readings.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
