import Link from "next/link";
import Image from "next/image";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Nav bar with semi-transparent dark background */}
      <div
        className="relative mx-auto flex h-[80px] max-w-[1200px] items-center justify-between px-6"
        style={{
          background: "linear-gradient(180deg, rgba(30,18,10,0.85) 0%, rgba(20,10,5,0.75) 100%)",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Logo — inline with nav, sized to fit the bar */}
        <Link href="/" className="relative shrink-0">
          <Image
            src="/images/home/png_logo_1.png"
            alt="AstrologyPro"
            width={180}
            height={83}
            className="h-[60px] w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/features"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            Features
          </Link>
          <Link
            href="/learn"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            Learn
          </Link>
          <Link
            href="/demo"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            See Demo
          </Link>
          <Link
            href="/pricing"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            Blog
          </Link>
          <Link
            href="/discover"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            Find a Reader
          </Link>
          <Link
            href="/join/advocate"
            className="text-[15px] font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-[#ecd396]"
          >
            Become an Affiliate
          </Link>
        </nav>

        {/* Right group */}
        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="text-[14px] font-bold uppercase text-white transition-colors hover:text-[#ecd396]"
          >
            Log In
          </Link>
          <Link
            href="/get-started"
            className="rounded-sm px-5 py-2 text-[14px] font-bold uppercase text-black transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg border border-white/10 md:hidden"
          aria-label="Menu"
        >
          <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
