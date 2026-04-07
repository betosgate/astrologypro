"use client";

import { useState } from "react";

interface Props {
  divinerUsername: string;
  divinerId: string;
  divinerName: string;
}

type FormState = "idle" | "loading" | "success" | "error";

interface FieldErrors {
  name?: string;
  email?: string;
  text?: string;
  rating?: string;
  general?: string;
}

export function TestimonialForm({
  divinerUsername,
  divinerName,
}: Props) {
  const [name, setName] = useState("");
  const [displayAlias, setDisplayAlias] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [consent, setConsent] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const MAX_CHARS = 2000;

  function handleStarClick(star: number) {
    setRating((prev) => (prev === star ? 0 : star));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});

    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (text.trim().length < 20) {
      errors.text = "Please write at least 20 characters.";
    } else if (text.trim().length > MAX_CHARS) {
      errors.text = `Testimonial must be ${MAX_CHARS} characters or fewer.`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFormState("loading");

    try {
      const res = await fetch(`/api/testimonials/${divinerUsername}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          text: text.trim(),
          rating: rating > 0 ? rating : undefined,
          service_name: serviceName.trim() || undefined,
          display_alias: displayAlias.trim() || undefined,
          consent_marketing: consent,
        }),
      });

      if (res.status === 201) {
        setFormState("success");
        return;
      }

      const data = await res.json();

      if (res.status === 422 && data.errors) {
        setFieldErrors(data.errors as FieldErrors);
        setFormState("error");
        return;
      }

      if (res.status === 429) {
        setFieldErrors({
          general: data.detail ?? "You have already submitted a testimonial recently. Please try again later.",
        });
        setFormState("error");
        return;
      }

      setFieldErrors({
        general: data.detail ?? "Something went wrong. Please try again.",
      });
      setFormState("error");
    } catch {
      setFieldErrors({ general: "Network error. Please try again." });
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <div className="rounded-xl border border-gold/20 bg-cosmos-800/60 p-8 text-center">
        <p className="text-2xl mb-3">✨</p>
        <h3 className="font-display text-lg font-semibold text-cream mb-2">
          Thank you!
        </h3>
        <p className="text-sm text-silver/70 leading-relaxed">
          Your testimonial has been submitted. Once reviewed, it will appear on
          this page.{" "}
          <span aria-hidden>✨</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="text-center mb-2">
        <h3 className="font-display text-xl font-semibold text-cream">
          Share Your Experience with {divinerName}
        </h3>
        <p className="text-sm text-silver/60 mt-1">
          Your review helps others discover the right guidance
        </p>
      </div>

      {fieldErrors.general && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {fieldErrors.general}
        </div>
      )}

      {/* Your Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="tf-name"
          className="block text-sm font-medium text-cream/80"
        >
          Your Name <span className="text-red-400" aria-hidden>*</span>
        </label>
        <input
          id="tf-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Jane Doe"
          aria-required="true"
          aria-describedby={fieldErrors.name ? "tf-name-err" : undefined}
          className={`w-full rounded-lg border bg-cosmos-900/60 px-4 py-2.5 text-sm text-cream placeholder:text-silver/30 outline-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
            fieldErrors.name ? "border-red-500/60" : "border-white/10"
          }`}
        />
        {fieldErrors.name && (
          <p id="tf-name-err" role="alert" className="text-xs text-red-400">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="tf-alias"
          className="block text-sm font-medium text-cream/80"
        >
          Display Name{" "}
          <span className="text-silver/40 font-normal">(optional)</span>
        </label>
        <input
          id="tf-alias"
          type="text"
          value={displayAlias}
          onChange={(e) => setDisplayAlias(e.target.value)}
          placeholder="Jane"
          title="The name shown publicly — leave blank to use your first name only"
          aria-describedby="tf-alias-hint"
          className="w-full rounded-lg border border-white/10 bg-cosmos-900/60 px-4 py-2.5 text-sm text-cream placeholder:text-silver/30 outline-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
        />
        <p id="tf-alias-hint" className="text-xs text-silver/40">
          The name shown publicly — leave blank to use your first name only
        </p>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="tf-email"
          className="block text-sm font-medium text-cream/80"
        >
          Email <span className="text-red-400" aria-hidden>*</span>
          <span className="text-silver/40 font-normal ml-1">(not shown publicly)</span>
        </label>
        <input
          id="tf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          aria-required="true"
          aria-describedby={fieldErrors.email ? "tf-email-err" : undefined}
          className={`w-full rounded-lg border bg-cosmos-900/60 px-4 py-2.5 text-sm text-cream placeholder:text-silver/30 outline-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
            fieldErrors.email ? "border-red-500/60" : "border-white/10"
          }`}
        />
        {fieldErrors.email && (
          <p id="tf-email-err" role="alert" className="text-xs text-red-400">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Rating */}
      <div className="space-y-1.5">
        <p className="block text-sm font-medium text-cream/80" id="tf-rating-label">
          Rating{" "}
          <span className="text-silver/40 font-normal">(optional)</span>
        </p>
        <div
          role="radiogroup"
          aria-labelledby="tf-rating-label"
          className="flex gap-1"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              onClick={() => handleStarClick(star)}
              className="text-2xl leading-none transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded"
            >
              <span
                className={
                  star <= rating ? "text-[#c9a84c]" : "text-silver/20"
                }
              >
                {star <= rating ? "★" : "☆"}
              </span>
            </button>
          ))}
        </div>
        {fieldErrors.rating && (
          <p role="alert" className="text-xs text-red-400">
            {fieldErrors.rating}
          </p>
        )}
      </div>

      {/* Testimonial text */}
      <div className="space-y-1.5">
        <label
          htmlFor="tf-text"
          className="block text-sm font-medium text-cream/80"
        >
          Your Testimonial <span className="text-red-400" aria-hidden>*</span>
        </label>
        <textarea
          id="tf-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Share your experience…"
          aria-required="true"
          aria-describedby={`tf-text-count${fieldErrors.text ? " tf-text-err" : ""}`}
          className={`w-full rounded-lg border bg-cosmos-900/60 px-4 py-3 text-sm text-cream placeholder:text-silver/30 outline-none resize-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
            fieldErrors.text ? "border-red-500/60" : "border-white/10"
          }`}
        />
        <div className="flex justify-between items-center">
          {fieldErrors.text ? (
            <p id="tf-text-err" role="alert" className="text-xs text-red-400">
              {fieldErrors.text}
            </p>
          ) : (
            <span />
          )}
          <p
            id="tf-text-count"
            className={`text-xs tabular-nums ml-auto ${
              text.length > MAX_CHARS
                ? "text-red-400"
                : text.length > MAX_CHARS * 0.9
                ? "text-yellow-500"
                : "text-silver/40"
            }`}
          >
            {text.length}/{MAX_CHARS}
          </p>
        </div>
      </div>

      {/* Service / Reading */}
      <div className="space-y-1.5">
        <label
          htmlFor="tf-service"
          className="block text-sm font-medium text-cream/80"
        >
          Service / Reading{" "}
          <span className="text-silver/40 font-normal">(optional)</span>
        </label>
        <input
          id="tf-service"
          type="text"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="e.g. Natal Chart Reading"
          className="w-full rounded-lg border border-white/10 bg-cosmos-900/60 px-4 py-2.5 text-sm text-cream placeholder:text-silver/30 outline-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
        />
      </div>

      {/* Consent */}
      <div className="flex items-start gap-3">
        <input
          id="tf-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 cursor-pointer rounded border-white/20 bg-cosmos-900/60 accent-[#c9a84c]"
        />
        <label
          htmlFor="tf-consent"
          className="text-sm text-silver/70 cursor-pointer leading-snug"
        >
          I consent to having my testimonial displayed publicly on this page
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === "loading" || !consent}
        className="w-full h-11 rounded-lg bg-[#c9a84c] text-sm font-semibold text-cosmos-900 transition-all hover:bg-[#d9b85c] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(201,168,76,0.25)] flex items-center justify-center gap-2"
      >
        {formState === "loading" ? (
          <>
            <svg
              className="animate-spin size-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
              />
            </svg>
            Submitting…
          </>
        ) : (
          "Submit Testimonial"
        )}
      </button>
    </form>
  );
}
