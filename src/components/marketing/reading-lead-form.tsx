"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, BadgeCheck, CalendarDays } from "lucide-react";
import { getDivinerAvatarUrl } from "@/lib/diviner-images";

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

export interface LeadDivinerCard {
  username: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  isCertified: boolean;
  startingPrice: number | null;
  specialties?: string[] | null;
}

interface ReadingLeadFormProps {
  serviceType: "astrology" | "tarot";
  serviceName: string;
  sourceUrl?: string;
  diviners?: LeadDivinerCard[];
}

type Step = 1 | 2;
type Status = "idle" | "loading" | "success" | "error";

export function ReadingLeadForm({
  serviceType,
  serviceName,
  sourceUrl,
  diviners = [],
}: ReadingLeadFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1
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

  // ── Success state: show reader selection ──────────────────────────────────
  if (status === "success") {
    return (
      <div className="space-y-6">
        {/* Confirmation banner */}
        <div className="flex items-start gap-3 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/8 px-4 py-4">
          <span className="mt-0.5 text-xl" aria-hidden="true">✅</span>
          <div>
            <p className="text-sm font-semibold text-[#f5f0e8]">
              Got it, {name.split(" ")[0]}! Your details are saved.
            </p>
            <p className="mt-0.5 text-xs text-[#b8bcd0]/60">
              We&apos;ll send your free guide to {email}. Now choose a reader and book your session below.
            </p>
          </div>
        </div>

        {/* Reader selection */}
        {diviners.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#f5f0e8]">
              Choose your {serviceType === "tarot" ? "tarot reader" : "astrologer"} and book:
            </p>
            <div className="space-y-3">
              {diviners.map((d) => (
                <DivinerBookingRow key={d.username} diviner={d} serviceType={serviceType} />
              ))}
            </div>
            <p className="text-center text-xs text-[#b8bcd0]/35">
              All readers are vetted and DIB certified. Secure payment via Stripe.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-[#b8bcd0]/60">
              Our team will match you with the right{" "}
              {serviceType === "tarot" ? "tarot reader" : "astrologer"} and be in touch shortly.
              Or browse all available readers now:
            </p>
            <a
              href={serviceType === "tarot" ? "/discover?type=tarot" : "/discover?type=astrologer"}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#c9a84c] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#e2c97e]"
            >
              Browse All {serviceType === "tarot" ? "Tarot Readers" : "Astrologers"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── Shared input styles ───────────────────────────────────────────────────
  const inputClass =
    "h-[48px] w-full rounded-lg border border-[#c9a84c]/20 bg-white/[0.04] px-4 text-sm text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors";

  const selectClass =
    "h-[48px] w-full rounded-lg border border-[#c9a84c]/20 bg-[#0d1117] px-4 text-sm text-[#f5f0e8] focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors appearance-none cursor-pointer";

  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#b8bcd0]/50";

  const submitButtonClass =
    "flex h-12 flex-1 items-center justify-center gap-2 rounded-lg font-semibold text-black transition-all hover:brightness-110 disabled:opacity-60";

  const submitButtonStyle = {
    background: "linear-gradient(180deg, #f8d275 0%, #cd912f 100%)",
    boxShadow: "0 4px 15px rgba(201,168,76,0.3)",
  };

  return (
    <div className="text-left">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
              step >= 1 ? "bg-[#c9a84c] text-black" : "border border-white/20 text-white/40"
            }`}
          >
            1
          </span>
          <span className={`text-xs font-medium ${step >= 1 ? "text-[#c9a84c]" : "text-white/30"}`}>
            About You
          </span>
        </div>
        <div className="h-px flex-1 bg-white/10" />
        <div className="flex items-center gap-2">
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
              step >= 2 ? "bg-[#c9a84c] text-black" : "border border-white/20 text-white/40"
            }`}
          >
            2
          </span>
          <span className={`text-xs font-medium ${step >= 2 ? "text-[#c9a84c]" : "text-white/30"}`}>
            {serviceType === "astrology" ? "Birth Details" : "Your Question"}
          </span>
        </div>
        <div className="h-px flex-1 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-white/40">
            3
          </span>
          <span className="text-xs font-medium text-white/30">Book</span>
        </div>
      </div>

      {/* Step 1 — Contact + life area */}
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
              <ArrowRight
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-[#c9a84c]/40"
                aria-hidden="true"
              />
            </div>
          </div>

          <button
            type="submit"
            className={submitButtonClass + " w-full"}
            style={submitButtonStyle}
          >
            Continue <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="text-center text-xs text-[#b8bcd0]/35">No spam. Unsubscribe anytime.</p>
        </form>
      )}

      {/* Step 2 — Astrology: birth details */}
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
                Birth Time{" "}
                <span className="text-[#b8bcd0]/35 normal-case font-normal">(optional)</span>
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
              Birth City &amp; Country <span className="text-[#c9a84c]">*</span>
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
              Anything specific to explore?{" "}
              <span className="text-[#b8bcd0]/35 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              id="astrology-note"
              rows={3}
              value={astrologyNote}
              onChange={(e) => setAstrologyNote(e.target.value)}
              placeholder="e.g. I'm navigating a career change and want clarity on timing..."
              className="w-full resize-none rounded-lg border border-[#c9a84c]/20 bg-white/[0.04] px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors"
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
              className={submitButtonClass}
              style={submitButtonStyle}
            >
              {status === "loading" ? "Saving…" : "Save & Choose My Reader"}
              {status !== "loading" && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Tarot: question */}
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
              className="w-full resize-none rounded-lg border border-[#c9a84c]/20 bg-white/[0.04] px-4 py-3 text-sm text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus:border-[#c9a84c]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors"
            />
            <p className="mt-1.5 text-xs text-[#b8bcd0]/35">
              Shared only with your matched reader. Not stored publicly.
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
              className={submitButtonClass}
              style={submitButtonStyle}
            >
              {status === "loading" ? "Saving…" : "Save & Choose My Reader"}
              {status !== "loading" && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Diviner booking row ────────────────────────────────────────────────────
function DivinerBookingRow({
  diviner,
  serviceType,
}: {
  diviner: LeadDivinerCard;
  serviceType: "astrology" | "tarot";
}) {
  const avatarUrl = getDivinerAvatarUrl(diviner.avatarUrl);

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all hover:border-[#c9a84c]/30 hover:bg-white/[0.04]">
      {/* Avatar */}
      <Image
        src={avatarUrl}
        alt={diviner.displayName}
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full border border-[#c9a84c]/20 object-cover"
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[#f5f0e8] transition-colors group-hover:text-[#c9a84c]">
            {diviner.displayName}
          </p>
          {diviner.isCertified && (
            <BadgeCheck className="size-3.5 shrink-0 text-[#c9a84c]" aria-label="DIB Certified" />
          )}
        </div>
        {diviner.tagline && (
          <p className="mt-0.5 truncate text-xs text-[#b8bcd0]/50">{diviner.tagline}</p>
        )}
        {diviner.specialties && diviner.specialties.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {diviner.specialties.slice(0, 2).map((s) => (
              <span
                key={s}
                className="rounded-full border border-[#c9a84c]/15 bg-[#c9a84c]/5 px-1.5 py-0.5 text-[10px] text-[#c9a84c]/70"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price + Book CTA */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {diviner.startingPrice !== null && (
          <p className="text-xs text-[#b8bcd0]/50">
            From <span className="font-semibold text-[#f5f0e8]">${diviner.startingPrice}</span>
          </p>
        )}
        <a
          href={`/${diviner.username}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#c9a84c] px-4 text-xs font-bold text-black transition-colors hover:bg-[#e2c97e]"
        >
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Book
        </a>
      </div>
    </div>
  );
}
