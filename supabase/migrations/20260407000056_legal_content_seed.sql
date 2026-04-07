-- Legal document content seed (version 1.0)
-- Updates placeholder rows inserted in 20260406000050_legal_policies.sql

-- 1. Customer Terms of Service
UPDATE legal_documents SET content = $content$
# Customer Terms of Service

**Effective Date:** April 7, 2026
**Version:** 1.0

Welcome to Divine Infinite Being ("Platform", "we", "us"). By creating an account or booking a reading you agree to these Terms of Service. Please read them carefully.

## 1. About Our Service

Divine Infinite Being connects customers with independent Diviners who offer astrology readings, tarot readings, natal chart interpretations, and related educational content. Sessions may be delivered via video, phone, or chat.

## 2. Age Requirement

You must be at least **18 years of age** to use this Platform. By registering, you confirm that you meet this requirement. We reserve the right to terminate accounts found to belong to minors.

## 3. Entertainment and Guidance Disclaimer

**All readings and content provided through this Platform are for entertainment and personal guidance purposes only.** They do not constitute professional medical, psychological, legal, financial, or any other regulated advice. You should always consult a qualified professional for decisions that may affect your health, finances, or legal standing. The Platform and its Diviners make no warranties regarding the accuracy, completeness, or reliability of any reading.

## 4. Booking and Cancellation Policy

- You may cancel or reschedule a booking up to **24 hours** before the scheduled session start time at no charge.
- Cancellations made within 24 hours of the session are non-refundable.
- If a Diviner cancels a confirmed session, you will receive a full refund or credit at your choice.
- No-shows forfeit the full session fee.

## 5. Refund Policy

Refunds are handled in accordance with our separate Refund Policy, which is incorporated into these Terms by reference. Refund requests must be submitted within **7 days** of the session date via the Help Center.

## 6. Prohibited Uses

You agree not to:

- Use the Platform for any unlawful purpose or in violation of any applicable law
- Harass, threaten, or abuse Diviners or other users
- Record sessions without the explicit consent of all parties
- Attempt to solicit Diviners to provide services outside the Platform to avoid fees
- Share, resell, or commercially exploit session content without written permission
- Submit false or fraudulent chargebacks or dispute claims

## 7. Intellectual Property

Session recordings (where applicable), transcripts, and Platform content are protected by copyright. You may not reproduce or distribute them without our prior written consent.

## 8. Limitation of Liability

To the maximum extent permitted by law, the Platform's total liability for any claim arising out of or relating to these Terms shall not exceed the amount you paid for the session giving rise to the claim.

## 9. Governing Law

These Terms are governed by the laws of the State of California, United States, without regard to its conflict-of-law provisions.

## 10. Contact

For questions about these Terms, contact us at **legal@divineinfinitebeing.com**.
$content$ WHERE document_type = 'customer_terms' AND version = '1.0';


-- 2. Diviner Service Agreement
UPDATE legal_documents SET content = $content$
# Diviner Service Agreement

**Effective Date:** April 7, 2026
**Version:** 1.0

This Diviner Service Agreement ("Agreement") governs your participation as a Diviner on the Divine Infinite Being Platform. By activating your Diviner account you accept this Agreement in full.

## 1. Independent Contractor Relationship

You are an **independent contractor**, not an employee, partner, or agent of Divine Infinite Being. You are solely responsible for your own taxes, insurance, and compliance with applicable laws. Nothing in this Agreement creates an employment relationship.

## 2. Services You Provide

As a Diviner you may offer astrology readings, tarot readings, natal chart interpretations, and related spiritual guidance sessions to customers through the Platform. You set your own availability and session rates within the limits established by the Platform.

## 3. Commission and Payout Terms

- The Platform retains a **service fee** (percentage disclosed in your Diviner Dashboard) from each completed session.
- You receive the remainder as your earnings.
- Payouts are processed on a **bi-weekly** basis via your connected payment method, provided your balance meets the minimum payout threshold of **$20**.
- The Platform reserves the right to withhold payouts pending investigation of disputed sessions or policy violations.

## 4. Code of Conduct

You agree to:

- **Never guarantee** specific outcomes or predictions
- **Never provide** medical, legal, financial, or psychological advice of any kind
- Treat all customers with respect, professionalism, and dignity
- Disclose all relevant conflicts of interest before a session
- Honor confirmed bookings; repeated no-shows or last-minute cancellations may result in account suspension

## 5. Content Standards

All content you deliver — written, verbal, or visual — must be truthful, non-deceptive, and appropriate for an adult audience. You must not share or solicit explicit sexual content, hate speech, or content that promotes harm.

## 6. Confidentiality

Customer session content and personal data are confidential. You may not share, sell, or disclose customer information to any third party, nor use it for marketing outside the Platform.

## 7. Account Termination

The Platform may suspend or terminate your Diviner account immediately for:

- Repeated or serious violations of this Agreement
- Fraudulent activity or false representations
- Harassment or misconduct toward customers
- Providing professional advice in a regulated field without appropriate licensure
- Attempting to solicit customers off-platform

Earned and unpaid balances at the time of a for-cause termination are subject to review and may be forfeited.

## 8. Dispute Resolution

Disputes between you and the Platform will be resolved through binding arbitration in accordance with the American Arbitration Association Commercial Rules, seated in Los Angeles, California.

## 9. Contact

For questions about this Agreement, contact **diviners@divineinfinitebeing.com**.
$content$ WHERE document_type = 'diviner_agreement' AND version = '1.0';


-- 3. Privacy Policy
UPDATE legal_documents SET content = $content$
# Privacy Policy

**Effective Date:** April 7, 2026
**Version:** 1.0

Divine Infinite Being ("we", "our", "Platform") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and the rights available to you.

## 1. Data We Collect

**Account information:** Name, email address, and password hash when you register.

**Profile and session data:** Date, time, and location of birth (for astrological chart generation), session history, and preferences you configure in your profile.

**Payment information:** Payment is processed by Stripe. We store only the last four digits of your card and your billing country. Full card numbers are never stored on our servers.

**Usage data:** Pages visited, session duration, device type, browser, and IP address, collected automatically via cookies and server logs.

**Communications:** Support messages, reviews, and any content you voluntarily submit to the Platform.

## 2. How We Use Your Data

- To deliver and improve our services (matching you with Diviners, generating charts, scheduling sessions)
- To process payments and prevent fraud
- To send transactional emails (booking confirmations, receipts, password resets)
- To send marketing communications where you have opted in — you may opt out at any time
- To comply with legal obligations

**We do not sell your personal data to third parties.**

## 3. Data Sharing

We share data only with:

- **Service providers** who operate under strict data processing agreements (Supabase for database hosting on AWS infrastructure, Stripe for payments, email delivery providers)
- **Law enforcement** when required by valid legal process

## 4. Cookies

We use essential cookies for authentication and session management, and optional analytics cookies (you may decline these via the cookie banner). We do not use third-party advertising cookies.

## 5. Data Retention

Account data is retained for the duration of your account and for up to **3 years** after deletion for fraud-prevention and legal compliance purposes.

## 6. Your Rights

Depending on your jurisdiction, you may have the right to:

- Access a copy of the personal data we hold about you
- Request correction of inaccurate data
- Request deletion of your data (subject to legal retention requirements)
- Object to or restrict certain processing
- Data portability (receive your data in a machine-readable format)

To exercise these rights, email **privacy@divineinfinitebeing.com**. We will respond within 30 days.

**California residents (CCPA):** You have the right to know, delete, and opt out of the sale of personal information (we do not sell your data).

**EU/UK residents (GDPR):** Our lawful basis for processing is contract performance (account and session delivery) and legitimate interests (security and fraud prevention).

## 7. Security

We use industry-standard encryption (TLS in transit, AES-256 at rest) and follow Supabase and AWS security best practices. Access to production data is restricted to authorised personnel.

## 8. Contact

For privacy questions or requests, contact **privacy@divineinfinitebeing.com** or write to: Divine Infinite Being, Privacy Team, Los Angeles, CA 90001.
$content$ WHERE document_type = 'privacy_policy' AND version = '1.0';


-- 4. Telephony Consent (Phone Dial-In Terms)
UPDATE legal_documents SET content = $content$
# Phone Dial-In Terms

**Effective Date:** April 7, 2026
**Version:** 1.0

These Phone Dial-In Terms apply when you choose to join or conduct a session using the telephone dial-in option on the Divine Infinite Being Platform.

## 1. Per-Minute Billing

Phone sessions are billed at the **per-minute rate** displayed at the time of booking. Billing begins when the session connection is established and ends when either party disconnects. Partial minutes are rounded up to the nearest full minute.

Your pre-authorised payment method will be charged automatically at the end of the session. Session length and total charge are displayed in your booking confirmation and session history.

## 2. Carrier Charges

In addition to Platform session charges, your telephone carrier may apply standard voice call rates, international calling fees, or data charges depending on your plan and location. **Divine Infinite Being is not responsible for charges imposed by your carrier.** Please check with your carrier before dialling in from an international number.

## 3. Recording Consent

By joining a session via phone dial-in you consent to the session being recorded for quality assurance, dispute resolution, and Platform safety purposes. Recordings are stored securely and handled in accordance with our Privacy Policy. If you do not consent to recording, please use the video or chat session option instead.

## 4. Call Quality

Call quality depends on your telephone network and may vary. Session fees are not automatically refunded for quality issues caused by your carrier or device. If you experience a significant technical failure attributable to the Platform, please contact our Help Center within 24 hours of the session to request a review.

## 5. Prohibited Uses

You may not:

- Record calls independently without the Diviner's consent
- Route calls through auto-dialler or VoIP services that mask your number without prior disclosure
- Use the dial-in feature for bulk, spam, or harassing communications

## 6. Contact

For billing questions related to phone sessions, contact **support@divineinfinitebeing.com**.
$content$ WHERE document_type = 'telephony_consent' AND version = '1.0';


-- 5. Affiliate Program Agreement
UPDATE legal_documents SET content = $content$
# Affiliate Program Agreement

**Effective Date:** April 7, 2026
**Version:** 1.0

This Affiliate Program Agreement ("Agreement") sets out the terms under which you ("Affiliate") participate in the Divine Infinite Being Affiliate Program.

## 1. Program Overview

As an approved Affiliate you earn a commission for new customers you refer to the Platform who complete a paid booking. Approval is at our sole discretion and we reserve the right to revoke participation at any time for cause.

## 2. Commission Rate and Duration

- You earn **10% of the net booking value** (excluding taxes and Platform fees) for every qualifying transaction completed by a referred customer.
- Commissions apply to all bookings made by a referred customer within **12 months** of their first qualifying registration via your unique referral link.
- After the 12-month window, no further commissions are earned from that customer unless they re-register through your link.

## 3. Cookie Duration

Referrals are tracked via a first-click attribution cookie with a **30-day duration**. If a prospective customer clicks your referral link and registers within 30 days, the conversion is attributed to you. If the customer has already been referred by another Affiliate, the earlier click takes precedence.

## 4. Payment Terms

- Commissions are paid monthly, provided your pending balance meets the **minimum payment threshold of $50**.
- Balances below $50 roll over to the following month.
- Payments are made via your nominated payment method (PayPal or bank transfer) within 15 business days of the end of each calendar month.
- Commissions are reversed if a referred booking is refunded or disputed.

## 5. Prohibited Promotional Methods

You may not:

- Use paid search ads that bid on our brand terms ("Divine Infinite Being", "DivineMystery", or similar) without prior written approval
- Send unsolicited bulk email (spam) using our referral links
- Represent yourself as an employee or official representative of the Platform
- Make false or misleading claims about our services in promotional materials
- Offer cash rebates or unauthorised incentives to prospective customers
- Use cookie-stuffing or any other deceptive tracking technique

Violation of these prohibitions may result in immediate termination of your affiliate account and forfeiture of unpaid commissions.

## 6. Disclosure Requirement

You must clearly and conspicuously disclose your affiliate relationship with the Platform in all promotional content, in compliance with FTC guidelines and any other applicable regulations.

## 7. Termination

Either party may terminate this Agreement with **14 days' written notice**. Commissions earned on transactions completed before the termination date will be paid at the next regular payout cycle, provided no policy violations are outstanding.

## 8. Governing Law

This Agreement is governed by the laws of the State of California, United States.

## 9. Contact

For affiliate programme questions, contact **affiliates@divineinfinitebeing.com**.
$content$ WHERE document_type = 'affiliate_agreement' AND version = '1.0';
