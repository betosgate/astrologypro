import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AstrologyPro</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/demo"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            See Demo
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log In
          </Link>
          <Button asChild>
            <Link href="/get-started">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
