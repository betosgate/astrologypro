"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What's included in the $197 setup fee?",
    answer:
      "The setup fee covers your account creation, branded landing page setup at astrologypro.com/username, full access to all professional astrology and tarot tools, and personalized onboarding support to get you up and running.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. Your account will stay active until the end of your current billing period, and you won't be charged again.",
  },
  {
    question: "How do client payments work?",
    answer:
      "Clients pay through Stripe directly to your connected account when they book a session. We take a small platform fee, and you receive the rest instantly — no waiting for payouts.",
  },
  {
    question: "Do I need my own website?",
    answer:
      "No. Your astrologypro.com/username page IS your website. It includes everything you need: your bio, services, booking calendar, testimonials, live stream embeds, and more.",
  },
  {
    question: "What video conferencing do you use?",
    answer:
      "We use Daily.co for HD video with screen sharing and automatic recording. No additional software is needed — everything runs in the browser for both you and your clients.",
  },
  {
    question: "Can I use my own Stripe or PayPal?",
    answer:
      "Yes, you connect your own Stripe account during onboarding so payments go directly to you. PayPal support is coming soon.",
  },
  {
    question: "How do the astrological event reminders work?",
    answer:
      "We track your clients' birth data and automatically send email reminders before solar returns, Saturn returns, and other significant transits. You can customize the email templates and choose which events trigger notifications.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We don't offer a free trial, but you can cancel within 30 days for a full refund. This gives you plenty of time to explore the platform and see if it's right for your practice.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
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
