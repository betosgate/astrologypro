"use client";

import { useState } from "react";
import { TestimonialForm } from "./testimonial-form";

interface Props {
  divinerUsername: string;
  /**
   * Optional — see note in TestimonialForm. Forwarded straight through
   * for callers that still pass it.
   */
  divinerId?: string;
  divinerName: string;
}

export function TestimonialFormToggle({
  divinerUsername,
  divinerId,
  divinerName,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gold/40 px-6 text-sm font-medium text-gold transition-all hover:border-gold/70 hover:bg-gold/5"
      >
        <span aria-hidden>✍️</span> Share Your Experience
      </button>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-xl border border-white/10 bg-cosmos-800/60 p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <span />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close testimonial form"
          className="text-silver/40 hover:text-silver/70 transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>
      <TestimonialForm
        divinerUsername={divinerUsername}
        divinerId={divinerId}
        divinerName={divinerName}
      />
    </div>
  );
}
