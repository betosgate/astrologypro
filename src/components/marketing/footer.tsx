import Link from "next/link";
import { Sparkles } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">AstrologyPro</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to run your divination business online.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="/instructions" className="text-sm text-muted-foreground hover:text-foreground">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Services</h3>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-muted-foreground">Astrology Readings</span></li>
              <li><span className="text-sm text-muted-foreground">Tarot Readings</span></li>
              <li><span className="text-sm text-muted-foreground">Video Consultations</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/instructions" className="text-sm text-muted-foreground hover:text-foreground">Getting Started Guide</Link></li>
              <li><a href="mailto:support@astrologypro.com" className="text-sm text-muted-foreground hover:text-foreground">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AstrologyPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
