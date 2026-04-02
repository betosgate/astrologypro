"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  bookingId: string;
  divinerId: string;
  divinerName: string;
  serviceName: string;
}

export function ReviewForm({
  bookingId,
  divinerId,
  divinerName,
  serviceName,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!text.trim()) {
      setError("Please write a review.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divinerId, path: `/portal/review/${bookingId}` }),
      });
      // Track the review page visit (fire-and-forget)
    } catch {
      // Ignore tracking errors
    }

    try {
      const res = await fetch(`/api/testimonials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          divinerId,
          rating,
          text: text.trim(),
          serviceName,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#c9a84c]/20 bg-[#0d1117]/80 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 text-4xl">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={i <= rating ? "text-[#c9a84c]" : "text-[#b8bcd0]/20"}
            >
              &#9733;
            </span>
          ))}
        </div>
        <h2 className="text-lg font-semibold text-[#f5f0e8]">
          Thank you for your review!
        </h2>
        <p className="mt-2 text-sm text-[#b8bcd0]/70">
          Your review will be published once approved by {divinerName}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#c9a84c]/20 bg-[#0d1117]/80 p-8 backdrop-blur-sm"
    >
      {/* Star rating */}
      <div className="mb-6 text-center">
        <p className="mb-3 text-sm text-[#b8bcd0]/70">Tap a star to rate</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <span
                className={`text-4xl ${
                  star <= (hoveredRating || rating)
                    ? "text-[#c9a84c] drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]"
                    : "text-[#b8bcd0]/20"
                }`}
              >
                &#9733;
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-xs text-[#c9a84c]">
            {rating === 5
              ? "Exceptional!"
              : rating === 4
                ? "Great experience!"
                : rating === 3
                  ? "Good"
                  : rating === 2
                    ? "Fair"
                    : "Poor"}
          </p>
        )}
      </div>

      {/* Text area */}
      <div className="mb-6">
        <Textarea
          placeholder="Share your experience... What insights did you gain? How did the reading help you?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="resize-none border-[#c9a84c]/10 bg-[#0d1117] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus-visible:ring-[#c9a84c]/30"
        />
      </div>

      {error && (
        <p className="mb-4 text-center text-sm text-red-400">{error}</p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
