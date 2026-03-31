import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#06080f]/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#c9a84c]" />
          <span className="gold-text text-xl font-bold">AstrologyPro</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/features"
            className="text-sm text-[#b8bcd0] transition-colors hover:text-[#c9a84c]"
          >
            Features
          </Link>
          <Link
            href="/demo"
            className="text-sm text-[#b8bcd0] transition-colors hover:text-[#c9a84c]"
          >
            See Demo
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[#b8bcd0] transition-colors hover:text-[#c9a84c]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#b8bcd0] transition-colors hover:text-[#c9a84c]"
          >
            Log In
          </Link>
          <Button asChild className="rounded-full bg-[#c9a84c] text-black hover:bg-[#e2c97e]">
            <Link href="/get-started">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
