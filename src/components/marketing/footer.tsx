import Link from "next/link";
import Image from "next/image";

const platformLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/instructions" },
  { label: "For Astrologers", href: "/for-astrologers" },
  { label: "Become an Affiliate", href: "/join/advocate" },
  { label: "See Demo", href: "/demo" },
  { label: "Find a Reader", href: "/discover" },
];

const learnAstrologyLinks = [
  { label: "Zodiac Signs", href: "/zodiac" },
  { label: "Houses", href: "/learn" },
  { label: "Planets", href: "/learn" },
  { label: "Aspects", href: "/learn" },
  { label: "Glossary", href: "/glossary" },
  { label: "Saturn Return Guide", href: "/guides/saturn-return" },
  { label: "Mercury Retrograde", href: "/guides/mercury-retrograde" },
];

const tarotGuideLinks = [
  { label: "All Card Meanings", href: "/tarot" },
  { label: "Major Arcana", href: "/tarot#major-arcana" },
  { label: "Wands", href: "/tarot#wands" },
  { label: "Cups", href: "/tarot#cups" },
  { label: "Swords", href: "/tarot#swords" },
  { label: "Pentacles", href: "/tarot#pentacles" },
  { label: "Tarot Spreads", href: "/tarot/spreads" },
];

const guidesLinks = [
  { label: "How Readings Work", href: "/guides/how-astrology-readings-work" },
  { label: "Start Astrology Business", href: "/guides/start-astrology-business" },
  { label: "Start Tarot Business", href: "/guides/start-tarot-business" },
  { label: "Pricing Your Readings", href: "/guides/pricing-your-readings" },
  { label: "All Guides", href: "/guides" },
];

const supportLinks = [
  { label: "Getting Started", href: "/instructions" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const zodiacSigns = [
  { symbol: "\u2648", name: "Aries", href: "/zodiac/aries" },
  { symbol: "\u2649", name: "Taurus", href: "/zodiac/taurus" },
  { symbol: "\u264A", name: "Gemini", href: "/zodiac/gemini" },
  { symbol: "\u264B", name: "Cancer", href: "/zodiac/cancer" },
  { symbol: "\u264C", name: "Leo", href: "/zodiac/leo" },
  { symbol: "\u264D", name: "Virgo", href: "/zodiac/virgo" },
  { symbol: "\u264E", name: "Libra", href: "/zodiac/libra" },
  { symbol: "\u264F", name: "Scorpio", href: "/zodiac/scorpio" },
  { symbol: "\u2650", name: "Sagittarius", href: "/zodiac/sagittarius" },
  { symbol: "\u2651", name: "Capricorn", href: "/zodiac/capricorn" },
  { symbol: "\u2652", name: "Aquarius", href: "/zodiac/aquarius" },
  { symbol: "\u2653", name: "Pisces", href: "/zodiac/pisces" },
];

const linkClass =
  "text-sm text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]";

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#f5f0e8]">{heading}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-[#040610]">
      {/* Main Footer Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/images/home/png_logo_1.png"
                alt="AstrologyPro"
                width={120}
                height={55}
                className="h-[55px] w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-sm text-[#b8bcd0]/70">
              The all-in-one platform for professional astrologers and tarot
              readers.
            </p>
          </div>

          {/* Column 2: Platform */}
          <FooterColumn heading="Platform" links={platformLinks} />

          {/* Column 3: Learn Astrology */}
          <FooterColumn heading="Learn Astrology" links={learnAstrologyLinks} />

          {/* Column 4: Tarot Guide */}
          <FooterColumn heading="Tarot Guide" links={tarotGuideLinks} />

          {/* Column 5: Guides */}
          <FooterColumn heading="Guides" links={guidesLinks} />

          {/* Column 6: Support */}
          <div>
            <h3 className="text-sm font-semibold text-[#f5f0e8]">Support</h3>
            <ul className="mt-3 space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:support@astrologypro.com"
                  className={linkClass}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Zodiac Strip */}
        <div className="mt-10 border-t border-[#c9a84c]/10 pt-8">
          <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#c9a84c]/60">
            Explore by Sign
          </h3>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {zodiacSigns.map((sign) => (
              <Link
                key={sign.name}
                href={sign.href}
                className="text-xs text-[#b8bcd0]/50 transition-colors hover:text-[#c9a84c]"
              >
                {sign.symbol} {sign.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="cosmic-divider mt-8" />
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <p className="text-xs text-[#b8bcd0]/50">
            &copy; {new Date().getFullYear()} AstrologyPro. All rights
            reserved.
          </p>
          <p className="text-xs text-[#b8bcd0]/30">
            Professional astrology and tarot reading platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
