import Link from "next/link";
import { Sparkles } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-[#040610]">
      {/* Gold cosmic divider */}
      <div className="cosmic-divider" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#c9a84c]" />
              <span className="gold-text text-lg font-bold">AstrologyPro</span>
            </Link>
            <p className="mt-3 text-sm text-[#b8bcd0]/70">
              Everything you need to run your divination business online.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f5f0e8]">Platform</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/features" className="text-sm text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Pricing</Link></li>
              <li><Link href="/instructions" className="text-sm text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f5f0e8]">Services</h3>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-[#b8bcd0]/70">Astrology Readings</span></li>
              <li><span className="text-sm text-[#b8bcd0]/70">Tarot Readings</span></li>
              <li><span className="text-sm text-[#b8bcd0]/70">Video Consultations</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f5f0e8]">Support</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/instructions" className="text-sm text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Getting Started Guide</Link></li>
              <li><a href="mailto:support@astrologypro.com" className="text-sm text-[#b8bcd0]/70 transition-colors hover:text-[#c9a84c]">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="cosmic-divider mt-8" />
        <div className="pt-8 text-center">
          <p className="text-sm text-[#b8bcd0]/50">
            &copy; {new Date().getFullYear()} AstrologyPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
