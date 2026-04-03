import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | AstrologyPro',
  description:
    'AstrologyPro privacy policy. Learn how we collect, use, protect, and share your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-[#b8bcd0]/60">
              Last updated: April 1, 2026
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-6 py-16">
          <div className="space-y-10 text-[#b8bcd0] leading-relaxed">
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                1. Introduction
              </h2>
              <p>
                AstrologyPro (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the AstrologyPro platform, including the website at astrologypro.com and associated services (collectively, the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using the Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                2. Information We Collect
              </h2>
              <h3 className="mb-2 font-semibold text-[#f5f0e8]">Personal Information You Provide</h3>
              <p className="mb-4">
                When you create an account, book a session, or contact us, we may collect: your name, email address, phone number, billing address, payment information (processed securely through Stripe), date/time/place of birth (for astrology services), and any other information you voluntarily provide during sessions or through our forms.
              </p>
              <h3 className="mb-2 font-semibold text-[#f5f0e8]">Information Collected Automatically</h3>
              <p>
                When you access the Service, we automatically collect certain information including: your IP address, browser type and version, operating system, referring URLs, pages visited, time and date of visits, time spent on pages, and device identifiers. We collect this information using cookies, web beacons, and similar tracking technologies.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                3. How We Use Your Information
              </h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-inside list-disc space-y-2 text-[#b8bcd0]/80">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information including booking confirmations and receipts</li>
                <li>Facilitate video sessions between clients and practitioners</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Communicate about products, services, offers, and events we think may interest you (with opt-out options)</li>
                <li>Monitor and analyze trends, usage, and activities in connection with the Service</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize and improve your experience on the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                4. Information Sharing and Disclosure
              </h2>
              <p className="mb-4">We may share your information in the following circumstances:</p>
              <ul className="list-inside list-disc space-y-2 text-[#b8bcd0]/80">
                <li><strong className="text-[#f5f0e8]">With Practitioners:</strong> When you book a session, we share your name, contact information, and session-relevant details (such as birth data) with the practitioner you selected.</li>
                <li><strong className="text-[#f5f0e8]">With Service Providers:</strong> We share information with third-party vendors who perform services on our behalf, including payment processing (Stripe), video conferencing (Daily.co), email delivery, and analytics.</li>
                <li><strong className="text-[#f5f0e8]">For Legal Reasons:</strong> We may disclose information if required by law, regulation, legal process, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
                <li><strong className="text-[#f5f0e8]">Business Transfers:</strong> In connection with any merger, acquisition, or sale of assets, your information may be transferred as a business asset.</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties. We do not share your birth data or session content with anyone other than your chosen practitioner.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                5. Cookies and Tracking Technologies
              </h2>
              <p>
                We use cookies and similar tracking technologies to collect and track information about your activity on our Service. Cookies are small data files placed on your device. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our Service may not function properly. We use essential cookies for authentication and security, functional cookies to remember your preferences, and analytics cookies to understand how you use the Service.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                6. Data Retention
              </h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you with the Service. We will also retain your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. If you request deletion of your account, we will remove your personal information within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                7. Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include encryption in transit (TLS/SSL), encryption at rest for sensitive data, secure authentication protocols, and regular security assessments. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                8. Your Rights and Choices
              </h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-inside list-disc space-y-2 text-[#b8bcd0]/80">
                <li><strong className="text-[#f5f0e8]">Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong className="text-[#f5f0e8]">Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                <li><strong className="text-[#f5f0e8]">Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements.</li>
                <li><strong className="text-[#f5f0e8]">Portability:</strong> Request a machine-readable copy of your data.</li>
                <li><strong className="text-[#f5f0e8]">Opt-out:</strong> Unsubscribe from marketing communications at any time using the link in our emails.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, contact us at privacy@astrologypro.com. We will respond to your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                9. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete that information promptly.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                10. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this policy periodically for any changes. Your continued use of the Service after changes are posted constitutes your acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                11. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:{' '}
                <a
                  href="mailto:privacy@astrologypro.com"
                  className="text-[#c9a84c] transition-colors hover:text-[#f8d275]"
                >
                  privacy@astrologypro.com
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </>
  )
}
