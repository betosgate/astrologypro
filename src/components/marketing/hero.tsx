import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Video, Calendar, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Star className="h-3.5 w-3.5" />
          The #1 Platform for Professional Diviners
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Run Your Divination{" "}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Business Online
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Get your own branded page, booking system, video sessions with screen
          sharing, client management, and marketing tools. Everything an
          astrologer or tarot reader needs in one platform.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="gap-2 text-base">
            <Link href="/get-started">
              Start Your Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link href="/features">See All Features</Link>
          </Button>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Video, label: "HD Video Sessions" },
            { icon: Calendar, label: "Smart Booking" },
            { icon: TrendingUp, label: "Marketing Tools" },
            { icon: Star, label: "Client Reviews" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
