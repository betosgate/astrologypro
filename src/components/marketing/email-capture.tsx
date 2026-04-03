"use client";

import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="relative px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div
          className="relative overflow-hidden rounded-2xl p-8 sm:p-12"
          style={{
            background: "linear-gradient(135deg, #0d0a1a 0%, #12081a 60%, #0a0d1a 100%)",
            border: "1px solid transparent",
            backgroundClip: "padding-box",
            boxShadow: "0 0 0 1px rgba(201,168,76,0.35), 0 0 40px rgba(201,168,76,0.08), 0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* Gold corner glow */}
          <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-[#c9a84c]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-[#c9a84c]/10 blur-3xl" />

          <div className="relative text-center">
            {/* Icon */}
            <div className="mb-5 inline-flex size-14 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10">
              <svg className="size-7 text-[#e2c97e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>

            {/* Headline */}
            <h2
              className="mb-3 text-2xl font-bold sm:text-3xl"
              style={{ color: "#f5f0e8" }}
            >
              Get Your Free{" "}
              <span style={{ color: "#e2c97e" }}>&lsquo;Pricing Your Readings&rsquo;</span>{" "}
              Guide
            </h2>

            {/* Subheadline */}
            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed" style={{ color: "#b8bcd0" }}>
              Discover how top astrologers price their services and earn{" "}
              <span style={{ color: "#e2c97e" }} className="font-semibold">$5k–$15k/month</span>
            </p>

            {/* Form */}
            {status === "success" ? (
              <div className="rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-6 py-5">
                <p className="text-lg font-semibold" style={{ color: "#e2c97e" }}>
                  Check your inbox! Your guide is on its way.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-[52px] flex-1 rounded-lg border border-[#c9a84c]/20 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/30"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-[52px] shrink-0 rounded-lg px-6 text-[15px] font-bold text-black transition-all hover:brightness-110 disabled:opacity-60 sm:px-8"
                  style={{
                    background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
                    boxShadow: "0 4px 15px rgba(201,168,76,0.3)",
                  }}
                >
                  {status === "loading" ? "Sending…" : "Send My Free Guide"}
                </button>
              </form>
            )}

            {/* Error */}
            {status === "error" && (
              <p className="mt-2 text-sm text-red-400">{errorMsg}</p>
            )}

            {/* Small print */}
            <p className="mt-4 text-xs" style={{ color: "#b8bcd0", opacity: 0.5 }}>
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
