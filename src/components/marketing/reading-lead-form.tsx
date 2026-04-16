"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";

const LIFE_AREAS = [
  "Career & Life Purpose",
  "Love & Relationships",
  "Family & Home",
  "Health & Wellbeing",
  "Finances & Abundance",
  "Spiritual Growth",
  "Identity & Self-Discovery",
  "Major Life Transition",
  "Other",
] as const;

interface ReadingLeadFormProps {
  serviceType: "astrology" | "tarot";
  serviceName: string;
  sourceUrl?: string;
}

type Step = 1 | 2;
type Status = "idle" | "loading" | "success" | "error";

export function ReadingLeadForm({ serviceType, serviceName, sourceUrl }: ReadingLeadFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [lifeArea, setLifeArea] = useState("");

  // Step 2 — astrology
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [astrologyNote, setAstrologyNote] = useState("");

  // Step 2 — tarot
  const [question, setQuestion] = useState("");

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/marketing/reading-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          life_area: lifeArea,
          service_type: serviceType,
          service_name: serviceName,
          birth_date: birthDate || undefined,
          birth_time: birthTime || undefined,
          birth_place: birthPlace.trim() || undefined,
          question: (serviceType === "tarot" ? question : astrologyNote).trim() || undefined,
          source_url: sourceUrl,
        }),
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

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#c9a84c]/30 bg-[#c9a84c]/8 px-6 py-8 text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-lg font-semibold text-[#f5f0e8]">
          You&apos;re on the list, {name.split(" ")[0]}!
        </p>
        <p className="mt-2 text-sm text-[#b8bcd0]/65">
          We&apos;ll match you with the right{" "}
          {serviceType === "tarot" ? "tarot reader" : "astrologer"} and send your free guide shortly.
        </p>
      </div>
    );
  }

  const inputClass =
    "h-[48px] w-full rounded-lg border border-[#c9a84c]/20 bg-white/[0.04] px-4 text-sm text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors";

  const selectClass =
    "h-[48px] w-full rounded-lg border border-[#c9a84c]/20 bg-[#0d1117] px-4 text-sm text-[#f5f0e8] focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors appearance-none cursor-pointer";

  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#b8bcd0]/50";

  return (
    <div className="text-left">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? "bg-[#c9a84c] text-black" : "border border-white/20 text-white/40"}`}>
            1
          </span>
          <span className={`text-xs font-medium ${step >= 1 ? "text-[#c9a84c]" : "text-white/30"}`}>
            About You
          </span>
        </div>
        <div className="h-px flex-1 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? "bg-[#c9a84c] text-black" : "border border-white/20 text-white/40"}`}>
            2
          </span>
          <span className={`text-xs font-medium ${step >= 2 ? "text-[#c9a84c]" : "text-white/30"}`}>
            {serviceType === "astrology" ? "Birth Details" : "Your Question"}
          </span>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lead-name" className={labelClass}>Your Name</label>
              <input
                id="lead-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="lead-email" className={labelClass}>Email Address</label>
              <input
                id="lead-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="lead-area" className={labelClass}>
              What area of life are you focusing on?
            </label>
            <div className="relative">
              <select
                id="lead-area"
                required
                value={lifeArea}
                onChange={(e) => setLifeArea(e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>Select an area…</option>
                {LIFE_AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-[#c9a84c]/40" aria-hidden="true" />
            </div>
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg font-semibold text-black transition-all hover:brightness-110"
            style={{ background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)", boxShadow: "0 4px 15px rgba(201,168,76,0.3)" }}
          >
            Continue <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="text-center text-xs text-[#b8bcd0]/35">No spam. Unsubscribe anytime.</p>
        </form>
      )}

      {/* Step 2 — Astrology */}
      {step === 2 && serviceType === "astrology" && (
        <form onSubmit={handleStep2} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="birth-date" className={labelClass}>
                Birth Date <span className="text-[#c9a84c]">*</span>
              </label>
              <input
                id="birth-date"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="birth-time" className={labelClass}>
                Birth Time <span className="text-[#b8bcd0]/35">(optional)</span>
              </label>
              <input
                id="birth-time"
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="birth-place" className={labelClass}>
              Birth City & Country <span className="text-[#c9a84c]">*</span>
            </label>
            <input
              id="birth-place"
              type="text"
              required
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="e.g. London, UK"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="astrology-note" className={labelClass}>
              Anything specific you want to explore? <span className="text-[#b8bcd0]/35">(optional)</span>
            </label>
            <textarea
              id="astrology-note"
              rows={3}
              value={astrologyNote}
              onChange={(e) => setAstrologyNote(e.target.value)}
              placeholder="e.g. I'm going through a big career change and want to understand my timing..."
              className="w-full rounded-lg border border-[#c9a84c]/20 bg-white/[0.04] px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors resize-none"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex h-12 items-center gap-1.5 rounded-lg border border-white/10 px-4 text-sm font-medium text-[#b8bcd0]/60 transition-colors hover:border-white/20 hover:text-[#b8bcd0]"
            >
              <ChevronLeft className="size-4" aria-hidden="true" /> Back
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg font-semibold text-black transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)", boxShadow: "0 4px 15px rgba(201,168,76,0.3)" }}
            >
              {status === "loading" ? "Sending…" : "Get My Free Guide"}
              {status !== "loading" && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Tarot */}
      {step === 2 && serviceType === "tarot" && (
        <form onSubmit={handleStep2} className="space-y-4">
          <div>
            <label htmlFor="tarot-question" className={labelClass}>
              What is your question or situation? <span className="text-[#c9a84c]">*</span>
            </label>
            <textarea
              id="tarot-question"
              rows={4}
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Be as specific as you like — the more context you give, the more focused your reading will be..."
              className="w-full rounded-lg border border-[#c9a84c]/20 bg-white/[0.04] px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors resize-none"
            />
            <p className="mt-1.5 text-xs text-[#b8bcd0]/35">
              This is shared only with your matched reader, not stored publicly.
            </p>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex h-12 items-center gap-1.5 rounded-lg border border-white/10 px-4 text-sm font-medium text-[#b8bcd0]/60 transition-colors hover:border-white/20 hover:text-[#b8bcd0]"
            >
              <ChevronLeft className="size-4" aria-hidden="true" /> Back
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg font-semibold text-black transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)", boxShadow: "0 4px 15px rgba(201,168,76,0.3)" }}
            >
              {status === "loading" ? "Sending…" : "Get My Free Guide"}
              {status !== "loading" && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
