import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = {
  title: "Refund & Cancellation Policy | AstrologyPro",
  description:
    "Learn about our refund and cancellation policies for sessions booked through AstrologyPro.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-[#f5f0e8]">
          Refund & Cancellation Policy
        </h1>

        <div className="space-y-8 text-[#b8bcd0]/90 leading-relaxed">
          <p>
            Effective Date: April 1, 2026. This policy applies to all sessions
            and services booked through the AstrologyPro platform.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              1. Cancellations Made 24+ Hours Before the Session
            </h2>
            <p>
              If you cancel your session at least 24 hours before the scheduled
              start time, you are eligible for a <strong>full refund</strong> of
              the session fee. Refunds will be issued to your original payment
              method.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              2. Cancellations Within 24 Hours
            </h2>
            <p>
              If you cancel within 24 hours of your scheduled session, you may
              receive a <strong>50% refund</strong> at the discretion of your
              diviner. Diviners reserve preparation time for each session, and
              late cancellations impact their availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              3. No-Shows
            </h2>
            <p>
              If you do not attend your scheduled session without prior notice,{" "}
              <strong>no refund</strong> will be issued. Your diviner is prepared
              and has reserved their time for your reading.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              4. Session Issues & Discretionary Refunds
            </h2>
            <p>
              If you experience technical difficulties or other issues during
              your session, your diviner may issue a{" "}
              <strong>discretionary refund</strong> through their dashboard.
              Diviners are empowered to handle refunds directly and can issue
              full or partial refunds as they see fit.
            </p>
            <p>
              If you are unable to resolve a refund directly with your diviner,
              please contact AstrologyPro support at{" "}
              <a
                href="mailto:support@astrologypro.com"
                className="text-[#c9a84c] hover:underline"
              >
                support@astrologypro.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              5. Phone Reading Sessions
            </h2>
            <p>
              Phone readings are billed based on duration. The base fee covers
              the initial session period, with per-minute charges applied for
              additional time. Charges are processed automatically using your
              saved payment method after the call ends. Refunds for phone
              sessions follow the same discretionary policy above.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              6. Refund Processing Time
            </h2>
            <p>
              Approved refunds are processed within{" "}
              <strong>5 to 10 business days</strong>. Depending on your bank or
              card issuer, it may take an additional 5-10 business days for the
              refund to appear on your statement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              7. Diviner Responsibilities
            </h2>
            <p>
              Diviners on AstrologyPro are independent practitioners responsible
              for managing their own refund policies within the guidelines above.
              Diviners issue refunds through their AstrologyPro dashboard.
              AstrologyPro facilitates the payment processing but does not
              independently adjudicate disputes between clients and diviners.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              8. Platform Subscription Fees
            </h2>
            <p>
              AstrologyPro platform subscription fees paid by diviners are
              non-refundable. Diviners may cancel their subscription at any time,
              and service will continue through the end of the current billing
              period.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#f5f0e8]">
              9. Contact Information
            </h2>
            <p>
              For refund requests or questions about this policy, please contact
              us at{" "}
              <a
                href="mailto:support@astrologypro.com"
                className="text-[#c9a84c] hover:underline"
              >
                support@astrologypro.com
              </a>
              .
            </p>
          </section>

          <section className="mt-12 rounded-lg border border-[#27272a] bg-[#18181b] p-6">
            <p className="text-sm text-[#b8bcd0]/70">
              All payments on AstrologyPro are processed securely by Stripe. By
              making a purchase on AstrologyPro, you agree to these refund and
              cancellation terms as well as our{" "}
              <a href="/terms" className="text-[#c9a84c] hover:underline">
                Terms of Service
              </a>
              . AstrologyPro complies with all applicable consumer protection
              regulations and Stripe&apos;s merchant policies.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
