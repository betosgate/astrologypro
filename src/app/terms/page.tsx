import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Terms of Service | AstrologyPro',
  description:
    'AstrologyPro terms of service. Read the terms and conditions governing your use of the AstrologyPro platform.',
}

export default function TermsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-[#040610]">
        <section className="border-b border-[#b8bcd0]/10 bg-gradient-to-b from-[#0d0f1a] to-[#040610] px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#f5f0e8] md:text-5xl">
              Terms of Service
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
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the AstrologyPro platform (&quot;Service&quot;), operated by AstrologyPro (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                2. Description of Service
              </h2>
              <p>
                AstrologyPro is an online platform that connects clients seeking astrology and tarot readings with professional practitioners. The Service includes practitioner profile pages, session booking, video conferencing, payment processing, and related tools. AstrologyPro is a platform facilitating connections between clients and independent practitioners — we do not provide readings directly and do not employ the practitioners listed on the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                3. Account Registration
              </h2>
              <p>
                To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to create an account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                4. Client Terms
              </h2>
              <div className="space-y-4">
                <p>
                  <strong className="text-[#f5f0e8]">Booking and Payment:</strong> When you book a session through the Service, you agree to pay the listed price. Payment is collected at the time of booking through our secure payment processor (Stripe). All prices are displayed in USD unless otherwise noted.
                </p>
                <p>
                  <strong className="text-[#f5f0e8]">Cancellations and Refunds:</strong> Cancellation and refund policies are set by individual practitioners and displayed on their profile pages. AstrologyPro&apos;s general refund policy is available at{' '}
                  <a href="/refund-policy" className="text-[#c9a84c] transition-colors hover:text-[#f8d275]">
                    /refund-policy
                  </a>
                  . If a practitioner fails to attend a scheduled session, you are entitled to a full refund.
                </p>
                <p>
                  <strong className="text-[#f5f0e8]">Nature of Services:</strong> Astrology and tarot readings provided through the platform are for entertainment, personal reflection, and spiritual guidance purposes. They are not substitutes for professional medical, psychological, legal, or financial advice. You acknowledge that readings reflect the practitioner&apos;s interpretation and should not be relied upon as the sole basis for important life decisions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                5. Practitioner Terms
              </h2>
              <div className="space-y-4">
                <p>
                  <strong className="text-[#f5f0e8]">Independent Contractor Status:</strong> Practitioners are independent contractors, not employees of AstrologyPro. You are responsible for your own taxes, insurance, and compliance with local laws and regulations governing your practice.
                </p>
                <p>
                  <strong className="text-[#f5f0e8]">Revenue Share:</strong> AstrologyPro retains 20% of each session fee to cover platform costs, payment processing, video infrastructure, and client acquisition. The remaining 80% is disbursed to the practitioner according to the payout schedule described in your practitioner agreement.
                </p>
                <p>
                  <strong className="text-[#f5f0e8]">Professional Conduct:</strong> Practitioners agree to conduct themselves professionally, deliver services as described, respect client confidentiality, and comply with all applicable laws. Practitioners must not provide medical, psychological, legal, or financial advice. AstrologyPro reserves the right to remove practitioners who violate these standards.
                </p>
                <p>
                  <strong className="text-[#f5f0e8]">Content Ownership:</strong> Practitioners retain ownership of their original content (bios, service descriptions, session content). By using the Service, you grant AstrologyPro a non-exclusive, worldwide license to display your profile information on the platform for the purpose of facilitating bookings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                6. Prohibited Conduct
              </h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-inside list-disc space-y-2 text-[#b8bcd0]/80">
                <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Interfere with or disrupt the Service or servers connected to it</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Harass, abuse, or harm other users of the Service</li>
                <li>Transmit any malicious software, viruses, or harmful code</li>
                <li>Collect or store personal information about other users without their consent</li>
                <li>Use the Service to send unsolicited communications or spam</li>
                <li>Circumvent the platform&apos;s payment system to transact directly with clients or practitioners met through the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                7. Intellectual Property
              </h2>
              <p>
                The Service and its original content (excluding user-generated content), features, and functionality are owned by AstrologyPro and are protected by international copyright, trademark, and other intellectual property laws. Our trademarks, logos, and service marks may not be used without our prior written consent. You may not reproduce, distribute, modify, or create derivative works of any part of the Service without express authorization.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                8. Disclaimer of Warranties
              </h2>
              <p>
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. WE DO NOT ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR QUALITY OF ANY READINGS PROVIDED BY PRACTITIONERS ON THE PLATFORM.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                9. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASTROLOGYPRO AND ITS DIRECTORS, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE, ANY READING OR ADVICE RECEIVED THROUGH THE SERVICE, OR ANY UNAUTHORIZED ACCESS TO YOUR ACCOUNT. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                10. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless AstrologyPro and its affiliates from any claims, liabilities, damages, losses, and expenses arising out of or in connection with your use of the Service, your violation of these Terms, or your violation of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                11. Termination
              </h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms. Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                12. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in any court of competent jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[#f5f0e8]">
                13. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact us at:{' '}
                <a
                  href="mailto:legal@astrologypro.com"
                  className="text-[#c9a84c] transition-colors hover:text-[#f8d275]"
                >
                  legal@astrologypro.com
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
