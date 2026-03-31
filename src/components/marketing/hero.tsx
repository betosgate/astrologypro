import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Video, Calendar, TrendingUp, Moon, Sun } from "lucide-react";
import { ZodiacWheel, TarotCardOutline, StarField, MoonPhases, ConstellationLines } from "./astro-decorations";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      {/* Layered mystical background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Star field across entire hero — gold-tinted */}
        <StarField className="absolute inset-0 h-full w-full text-amber-200/80" />

        {/* Additional subtle star dots */}
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 17 + 7) % 100}%`,
                top: `${(i * 23 + 13) % 100}%`,
                backgroundColor: i % 2 === 0 ? 'rgba(201, 168, 76, 0.4)' : 'rgba(226, 201, 126, 0.25)',
                animation: `shimmer ${3 + (i % 4)}s ease-in-out ${(i % 5) * 0.8}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Primary glow — warm gold */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-radial from-amber-900/8 via-amber-950/5 to-transparent blur-3xl" />

        {/* Zodiac wheel - left side, slow rotation */}
        <ZodiacWheel className="animate-zodiac-spin absolute -left-20 top-10 h-[400px] w-[400px] text-amber-400/30 sm:left-0" />

        {/* Tarot cards - right side, more subtle */}
        <TarotCardOutline className="absolute -right-10 top-20 h-[300px] w-[180px] rotate-12 text-amber-300/20 sm:right-10" />
        <TarotCardOutline className="absolute right-5 top-32 h-[280px] w-[170px] -rotate-6 text-amber-200/15 sm:right-24" />

        {/* Constellation pattern */}
        <ConstellationLines className="absolute left-1/4 top-0 h-[200px] w-[300px] text-amber-200/20" />

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06080f] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Decorative moon phases above heading — gold tinted */}
        <MoonPhases className="mx-auto mb-8 h-10 w-64 text-amber-300/50 sm:w-80" />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-1.5 text-sm text-[#e2c97e] backdrop-blur-sm">
          <Star className="h-3.5 w-3.5" />
          The #1 Platform for Professional Diviners
        </div>

        <h1 className="font-display text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-6xl lg:text-8xl">
          Run Your Divination{" "}
          <span className="gold-text">
            Business Online
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#b8bcd0] sm:text-xl">
          Get your own branded page, booking system, video sessions with screen
          sharing, client management, and marketing tools. Everything an
          astrologer or tarot reader needs in one platform.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="gap-2 rounded-full bg-[#c9a84c] px-8 text-base font-semibold text-black shadow-lg shadow-[#c9a84c]/25 hover:bg-[#e2c97e]">
            <Link href="/get-started">
              Start Your Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-full border-[#c9a84c]/40 px-8 text-base text-[#e2c97e] backdrop-blur-sm hover:border-[#c9a84c] hover:bg-[#c9a84c]/10">
            <Link href="/features">See All Features</Link>
          </Button>
        </div>

        {/* Feature pills with glass-morphism */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#b8bcd0] backdrop-blur-md"
            >
              <Icon className="h-4 w-4 text-[#c9a84c]" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
