import Link from "next/link";
import Image from "next/image";
import { SectionContainer } from "@/components/shared/section-container";

const features = [
  { icon: "/images/home/HD-Video-Sessions.png", label: "HD Video Sessions", href: "/features", gold: true },
  { icon: "/images/home/Smart-Booking.png", label: "Smart Booking", href: "/demo", gold: false },
  { icon: "/images/home/Chart-Calculations.png", label: "Chart Calculations", href: "/features", gold: true },
  { icon: "/images/home/Tarot-Spreads.png", label: "Tarot Spreads", href: "/features", gold: false },
  { icon: "/images/home/Marketing-Tools.png", label: "Marketing Tools", href: "/features", gold: true },
  { icon: "/images/home/Client-Reviews.png", label: "Client Reviews", href: "/discover", gold: false },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#100101" }}>
      {/* ===== LAYERED BACKGROUND ===== */}

      {/* Layer 1 — left side ambient image */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/home/2151038292_1.png"
          alt=""
          width={739}
          height={1074}
          className="absolute left-0 top-0 h-full w-auto object-cover opacity-60"
          priority
        />
      </div>

      {/* Layer 2 — top atmospheric */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/home/1405.png"
          alt=""
          width={983}
          height={408}
          className="absolute left-0 top-0 h-auto w-[50%] object-cover opacity-70"
        />
      </div>

      {/* Layer 3 — full-width atmospheric overlay */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/home/1405_1.png"
          alt=""
          width={1920}
          height={1074}
          className="absolute left-0 top-0 h-full w-full object-cover opacity-50"
        />
      </div>

      {/* Layer — dark overlay pattern */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/home/layer_78.png"
          alt=""
          width={1920}
          height={1074}
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
      </div>

      {/* Layer — decorative bottom element */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
        <Image
          src="/images/home/layer_23.png"
          alt=""
          width={596}
          height={219}
          className="h-auto w-[400px] opacity-80 sm:w-[500px] lg:w-[596px]"
        />
      </div>

      {/* Layer — center mystical image — aligned near top, right below nav */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
        <Image
          src="/images/home/changeimage.png"
          alt=""
          width={1128}
          height={738}
          className="h-auto w-[90%] max-w-[1000px] opacity-80 sm:w-[800px] lg:w-[1000px]"
        />
      </div>

      {/* Layer — vignette/frame overlay */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/home/layer_66.png"
          alt=""
          width={1885}
          height={808}
          className="absolute left-1/2 top-[5%] h-auto w-full -translate-x-1/2 opacity-70"
        />
      </div>

      {/* ===== CONTENT ===== */}
      <SectionContainer className="relative z-10 pb-3 pt-6 md:pt-8">
        {/* Badge */}
        <div className="mb-6 flex justify-center md:justify-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-1.5 text-sm text-[#e2c97e] backdrop-blur-sm">
            <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            The #1 Platform for Professional Diviners
          </div>
        </div>

        {/* Headline — using the text images for exact match */}
        <div className="flex flex-col items-center gap-3 md:items-start">
          <Image
            src="/images/home/run_your_divination.png"
            alt="Run Your Divination"
            width={1078}
            height={70}
            className="h-auto w-[90%] max-w-[700px] md:w-[650px] lg:w-[800px]"
            priority
          />
          <Image
            src="/images/home/business_online.png"
            alt="Business Online"
            width={779}
            height={67}
            className="h-auto w-[70%] max-w-[550px] md:w-[480px] lg:w-[600px]"
            priority
          />
        </div>

        {/* Description */}
        <p className="mx-auto mt-8 max-w-[700px] text-center text-lg leading-relaxed text-white/80 text-shadow md:mx-0 md:text-left md:text-xl"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
        >
          Get your own branded page, booking system, video sessions with screen
          sharing, client management, and marketing tools. Everything an
          astrologer or tarot reader needs in one platform.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row md:justify-start">
          <Link
            href="/get-started"
            className="flex h-[60px] w-[280px] items-center justify-center rounded text-xl font-bold text-white transition-transform hover:-translate-y-0.5 sm:w-[300px]"
            style={{
              background: "linear-gradient(180deg, #f20f0f -11%, #b70101 88%)",
              boxShadow: "0 4px 15px rgba(242, 15, 15, 0.4)",
            }}
          >
            Start Your Practice
          </Link>
          <Link
            href="/features"
            className="flex h-[60px] w-[280px] items-center justify-center rounded text-xl font-bold text-black transition-transform hover:-translate-y-0.5 sm:w-[300px]"
            style={{
              background: "linear-gradient(180deg, #dde0e2 -36%, #ffffff 6%, #747576 114%)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            See All Features
          </Link>
        </div>

        {/* M6 — 30-Day Money-Back Guarantee */}
        <div className="mt-5 flex items-center justify-center gap-2 md:justify-start">
          <svg className="size-4 shrink-0 text-[#e2c97e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10.5c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286z" />
          </svg>
          <span
            className="text-sm font-medium"
            style={{ color: "#e2c97e", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
          >
            30-Day Money-Back Guarantee — Try risk-free
          </span>
        </div>

        {/* M4 — Aggregate Social Proof Stats */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          {[
            { value: "1,200+", label: "Sessions Booked" },
            { value: "340+",   label: "Diviners" },
            { value: "4.9★",   label: "Average Rating" },
            { value: "98%",    label: "Client Satisfaction" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-base font-bold" style={{ color: "#e2c97e" }}>{value}</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Feature strip */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {features.map(({ icon, label, href, gold }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-3 transition-transform hover:-translate-y-1"
            >
              <Image
                src={icon}
                alt=""
                width={64}
                height={64}
                className="size-12 object-contain brightness-0 invert lg:size-14"
              />
              <div
                className="flex h-[50px] w-full items-center justify-center rounded-sm px-2 text-center text-sm font-bold text-[#120809] shadow-md lg:h-[56px] lg:text-base"
                style={{
                  background: gold
                    ? "linear-gradient(180deg, #f8d275, #cd912f)"
                    : "linear-gradient(180deg, #dde0e2, #ffffff 6%, #747576)",
                }}
              >
                {label}
              </div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
