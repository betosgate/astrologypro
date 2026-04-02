import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "AstrologyPro transformed my practice. I went from 3 clients a week to 15.",
    name: "Maya S.",
    role: "Astrologer",
    gradient: "from-purple-400 to-indigo-500",
    rating: 5,
  },
  {
    quote:
      "The booking system alone is worth the subscription. My clients love how easy it is.",
    name: "Luna W.",
    role: "Tarot Reader",
    gradient: "from-pink-400 to-purple-500",
    rating: 5,
  },
  {
    quote:
      "I was spending $200/month on Zoom + Calendly + Squarespace. Now it's all in one place.",
    name: "Orion K.",
    role: "Astrologer",
    gradient: "from-indigo-400 to-blue-500",
    rating: 5,
  },
];

export function DivinerTestimonials() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Loved by{" "}
            <span className="text-primary">Practitioners</span>
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Hear from diviners who transformed their practice with AstrologyPro
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Top gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-primary to-indigo-500" />

              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="mb-6 text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-bold text-white`}
                >
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
