import Link from "next/link";
import { Sparkles } from "lucide-react";

const variants = {
  client: {
    heading: "Ready to Consult a Professional Astrologer?",
    description:
      "Book a personalized reading with one of our verified astrologers. Get clarity on love, career, finances, and your life path.",
    cta: "Find Your Astrologer",
    href: "/discover",
  },
  diviner: {
    heading: "Launch Your Astrology Practice Online",
    description:
      "Everything you need to run a professional divination business — booking, video sessions, payments, and your own branded page.",
    cta: "Get Started Free",
    href: "/get-started",
  },
  practitioner: {
    heading: "Start Your Professional Practice Today",
    description:
      "Join hundreds of diviners using AstrologyPro to manage bookings, run video sessions, and grow their practice online.",
    cta: "Get Started",
    href: "/get-started",
  },
};

export function CtaBanner({
  variant = "diviner",
}: {
  variant?: "client" | "diviner" | "practitioner";
}) {
  const v = variants[variant];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#0c0e1a] to-[#121530] p-8 text-center sm:p-12">
        <Sparkles className="mx-auto mb-4 h-8 w-8 text-[#c9a84c]" />
        <h2 className="font-display text-2xl font-bold text-[#f5f0e8] sm:text-3xl">
          {v.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[#b8bcd0]">
          {v.description}
        </p>
        <Link
          href={v.href}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c9a84c] px-8 py-3 font-semibold text-[#040610] transition-all hover:bg-[#d4b65e] hover:shadow-lg hover:shadow-[#c9a84c]/20"
        >
          {v.cta}
        </Link>
      </div>
    </section>
  );
}
