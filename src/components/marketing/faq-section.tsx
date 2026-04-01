"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What's the difference between the three plans?",
    answer:
      "Every plan includes the same powerful platform — video sessions, booking, CRM, marketing tools, and your branded page. The only difference is the consultation types: The Tarot Reader includes 8 tarot spreads + freelance sessions, The Astrologer includes 11 astrology readings + freelance sessions, and The Oracle includes everything plus dedicated phone readings.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Absolutely. You can upgrade from a single-specialty plan to The Oracle at any time. We'll prorate the difference so you only pay the delta.",
  },
  {
    question: "What's included in the setup fee?",
    answer:
      "The setup fee covers your account creation, branded landing page at astrologypro.com/your-name, full access to professional astrology and tarot back-office tools, all email templates, and personalized onboarding support.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. Your account stays active until the end of your current billing period. Plus, we offer a 30-day money-back guarantee — if it's not right for you, we'll refund everything.",
  },
  {
    question: "How do client payments work?",
    answer:
      "Clients pay through Stripe when they book a session. You receive 80% of every session fee directly to your connected Stripe account — no waiting for payouts, no invoicing. We handle all the payment infrastructure.",
  },
  {
    question: "Do I need my own website?",
    answer:
      "No. Your astrologypro.com/your-name page IS your website. It includes your bio, services, booking calendar, testimonials, live stream embeds, gift certificates, and more. Share one link and you're in business.",
  },
  {
    question: "What video platform do you use?",
    answer:
      "Daily.co powers our HD video sessions with screen sharing and automatic recording. No additional software needed — everything runs in the browser for both you and your clients.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We don't offer a free trial, but we do offer a 30-day money-back guarantee. This gives you plenty of time to explore the platform and start booking clients with zero risk.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Frequently Asked <span className="text-primary">Questions</span>
        </h2>
        <div className="mt-12 divide-y divide-border">
          {faqs.map((faq, index) => (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between py-5 text-left"
              >
                <span className="text-base font-medium">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index
                    ? "max-h-96 pb-5 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
