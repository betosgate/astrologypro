"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Star, Calendar, DollarSign } from "lucide-react";

const stats = [
  { icon: Calendar, label: "Sessions Completed", value: "12,000+" },
  { icon: Star, label: "Average Rating", value: "4.9" },
  { icon: DollarSign, label: "Earned by Practitioners", value: "$2M+" },
];

const avatarGradients = [
  "from-purple-400 to-indigo-500",
  "from-pink-400 to-purple-500",
  "from-indigo-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-fuchsia-400 to-pink-500",
  "from-blue-400 to-indigo-500",
  "from-purple-500 to-violet-600",
  "from-indigo-500 to-purple-600",
];

const avatarInitials = ["MS", "LW", "OK", "AR", "JT", "NP", "RK", "SC"];

export function SocialProofBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-y bg-card/50 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl text-center">
        {/* Heading */}
        <div
          className={`transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-primary">
            <Users className="size-4" />
            <span>Trusted by Practitioners Worldwide</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Join{" "}
            <span className="text-primary">200+ practitioners</span>{" "}
            growing their practice on AstrologyPro
          </h2>
        </div>

        {/* Avatar row */}
        <div
          className={`mt-8 flex items-center justify-center transition-all delay-200 duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="flex -space-x-3">
            {avatarGradients.map((gradient, i) => (
              <div
                key={i}
                className={`flex size-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white ring-2 ring-background sm:size-12 sm:text-sm`}
                style={{
                  animationDelay: `${i * 100}ms`,
                }}
              >
                {avatarInitials[i]}
              </div>
            ))}
          </div>
          <span className="ml-4 text-sm text-muted-foreground">
            & many more
          </span>
        </div>

        {/* Stats */}
        <div
          className={`mt-10 grid grid-cols-3 gap-6 transition-all delay-400 duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-center gap-1.5">
                <Icon className="size-4 text-primary" />
                <span className="text-2xl font-bold sm:text-3xl">{value}</span>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
