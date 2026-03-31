import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Video, Calendar, TrendingUp, Moon, Sun } from "lucide-react";
import { ZodiacWheel, TarotCardOutline, StarField, MoonPhases, ConstellationLines } from "./astro-decorations";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      {/* Layered mystical background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Star field across entire hero */}
        <StarField className="absolute inset-0 h-full w-full text-purple-300" />

        {/* Primary glow */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-radial from-primary/8 via-purple-900/5 to-transparent blur-3xl" />

        {/* Zodiac wheel - left side */}
        <ZodiacWheel className="absolute -left-20 top-10 h-[400px] w-[400px] text-purple-400 opacity-60 sm:left-0" />

        {/* Tarot cards - right side */}
        <TarotCardOutline className="absolute -right-10 top-20 h-[300px] w-[180px] rotate-12 text-indigo-400 opacity-50 sm:right-10" />
        <TarotCardOutline className="absolute right-5 top-32 h-[280px] w-[170px] -rotate-6 text-purple-400 opacity-30 sm:right-24" />

        {/* Constellation pattern */}
        <ConstellationLines className="absolute left-1/4 top-0 h-[200px] w-[300px] text-blue-300 opacity-40" />

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Decorative moon phases above heading */}
        <MoonPhases className="mx-auto mb-8 h-10 w-64 text-purple-300 opacity-60 sm:w-80" />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary backdrop-blur-sm">
          <Star className="h-3.5 w-3.5" />
          The #1 Platform for Professional Diviners
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Run Your Divination{" "}
          <span className="bg-gradient-to-r from-purple-400 via-primary to-indigo-400 bg-clip-text text-transparent">
            Business Online
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Get your own branded page, booking system, video sessions with screen
          sharing, client management, and marketing tools. Everything an
          astrologer or tarot reader needs in one platform.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="gap-2 text-base shadow-lg shadow-primary/25">
            <Link href="/get-started">
              Start Your Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base backdrop-blur-sm">
            <Link href="/features">See All Features</Link>
          </Button>
        </div>

        {/* Feature pills with astrology/tarot icons */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Video, label: "HD Video Sessions" },
            { icon: Calendar, label: "Smart Booking" },
            { icon: Sun, label: "Chart Calculations" },
            { icon: Moon, label: "Tarot Spreads" },
            { icon: TrendingUp, label: "Marketing Tools" },
            { icon: Star, label: "Client Reviews" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
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
