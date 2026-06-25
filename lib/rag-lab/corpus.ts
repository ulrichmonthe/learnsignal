// Helix Pay corpus — 8 documents designed so chunking decisions matter.
// doc-fraud: liability sentence straddles the word-256 boundary (the Mission 2 crux).
// doc-refunds: contains "Section 420" (exact match) + semantic dispute paragraph.
// doc-api-changelog: two payout-timing versions (fresh vs stale).

import type { Document } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// WORD POSITION MAP (approximate, for doc-fraud boundary guarantee):
//   "the account holder" ≈ word 253  (near end of chunk-0 at size 256)
//   "bears no liability" ≈ word 258  (start of chunk-1 at size 256)
//   Gold span: chars ~1495–1600 (straddles the ~1280-char boundary for size 256)
// ─────────────────────────────────────────────────────────────────────────────

export const CORPUS: Document[] = [

  // ── doc-refunds ────────────────────────────────────────────────────────────
  {
    id: 'doc-refunds',
    title: 'Helix Pay — Refund & Chargeback Policy',
    type: 'policy',
    version: '2024-11',
    body: `Helix Pay Refund and Chargeback Policy — Version 2024-11

This document governs all refund requests, dispute filings, and chargeback claims submitted through the Helix Pay platform. These policies apply to all verified account holders and supersede any prior communications on the subject. Helix Pay reserves the right to update these terms; changes are effective upon publication.

GENERAL REFUND ELIGIBILITY

Refund requests must be submitted within thirty calendar days of the original transaction date. Transactions that have been completed and settled are generally non-refundable except under the circumstances outlined in this policy. Helix Pay does not issue refunds for digital goods or services that have been fully delivered and accessed by the purchaser. Partial refunds may be granted at Helix Pay's sole discretion in cases where a service was only partially rendered.

To initiate a refund, account holders must log in to the Helix Pay portal, navigate to Transaction History, locate the relevant transaction, and submit a Refund Request Form with a written explanation. Requests submitted via phone or email without a corresponding portal submission will not be processed.

SECTION 420 — DISPUTED TRANSACTIONS AND CHARGEBACK RIGHTS

Section 420 of this policy governs the formal dispute process for transactions the account holder believes to be erroneous, duplicated, or otherwise invalid. Under Section 420, an account holder may file a formal dispute within forty-five calendar days of the transaction posting date. Upon filing, Helix Pay will initiate an investigation and suspend any related payment obligations during the review period. If the dispute is resolved in the account holder's favor, a full credit will be issued to the originating payment method within ten business days. Disputes that are found to be unsubstantiated will be closed with a written explanation sent to the account holder.

MISREPRESENTATION AND INELIGIBLE CLAIMS

Customers who knowingly provide inaccurate information in order to obtain a credit or chargeback they are not entitled to will have their request denied without further review. Deliberate misrepresentation of a transaction, including exaggerating losses, fabricating circumstances, or submitting false documentation, constitutes fraud under Helix Pay's platform terms and may result in immediate account suspension. Accounts found to have engaged in repeated misrepresentation will be referred to Helix Pay's fraud prevention team and, where applicable, to relevant regulatory authorities. Helix Pay cooperates fully with law enforcement investigations arising from fraudulent chargeback activity.

PROCESSING TIMELINES

Standard refund requests are processed within seven to ten business days from the date the request is approved. Chargeback requests filed under Section 420 follow the dispute investigation timeline, which may extend up to thirty business days. Account holders will receive email notification at each stage of the process.`,
  },

  // ── doc-fraud ──────────────────────────────────────────────────────────────
  // CRITICAL: "the account holder" is placed at words ~252-254 and
  // "bears no liability" at words ~258-261 so a 256-word chunk boundary splits them.
  {
    id: 'doc-fraud',
    title: 'Helix Pay — Fraud & Liability Handbook',
    type: 'legal',
    version: '2024-11',
    body: `Helix Pay Fraud and Liability Handbook — Version 2024-11

This handbook establishes Helix Pay's framework for identifying, investigating, and resolving fraudulent activity. It defines the rights and obligations of account holders and of Helix Pay in circumstances involving unauthorized transactions, identity theft, and payment manipulation.

SECTION 1 — FRAUD IDENTIFICATION

Helix Pay employs a multi-layer fraud detection system that monitors transactions in real time. Signals used to flag potentially fraudulent activity include unusual geographic patterns, transaction velocity anomalies, mismatches between the registered device and the initiating device, and requests that deviate significantly from a user's established spending profile. When one or more fraud signals are triggered, the transaction may be held for manual review, declined automatically, or processed subject to additional authentication. Account holders will be notified by email or push notification when a transaction is flagged.

SECTION 2 — REPORTING UNAUTHORIZED TRANSACTIONS

Account holders who discover an unauthorized transaction on their account should report it immediately through the Helix Pay portal by selecting the relevant transaction and choosing the Report Unauthorized Activity option. Reports may also be submitted by contacting Helix Pay Customer Security at the number listed on the back of your linked payment card. Prompt reporting is critical: reports submitted within seventy-two hours of the unauthorized transaction receive priority investigation status and are eligible for expedited provisional credit. Reports submitted more than thirty days after the transaction may not qualify for full liability protection under applicable consumer financial protection regulations.

SECTION 3 — INVESTIGATION AND LIABILITY DETERMINATION

Upon receiving a report of unauthorized activity, Helix Pay initiates a formal investigation. The investigation involves reviewing transaction logs, device fingerprints, authentication records, and any communications associated with the account at the relevant time. Where necessary, Helix Pay may request additional documentation from the account holder, such as a signed affidavit or police report. The investigation is conducted in accordance with applicable financial regulations and is typically completed within ten business days. Provisional credit may be issued during the investigation period at Helix Pay's discretion. When the investigation concludes, the determination is made as to the allocation of responsibility. In cases where the investigation finds that the transaction was initiated without the explicit knowledge or authorization of the account holder,
the account holder
bears no liability for the unauthorized transaction, and any provisional credit becomes permanent. Where the investigation concludes that the account holder contributed to the unauthorized activity — for example by sharing credentials, failing to report a lost device, or authorizing a payment under deception — partial or full liability may be assigned at Helix Pay's discretion.

SECTION 4 — AUTHORIZED PUSH PAYMENT FRAUD

Authorized Push Payment (APP) fraud occurs when a user is deceived into authorizing a payment to a fraudulent recipient. Unlike unauthorized transactions, APP fraud involves a payment the account holder did explicitly authorize, albeit under false pretenses. Who is liable when a user is tricked into authorizing a payment to a fraudulent recipient depends on the specific facts of the case. Helix Pay investigates each APP fraud claim under its Reimbursement Framework. Account holders who report APP fraud promptly, have not acted with gross negligence, and cooperate fully with the investigation are eligible for reimbursement under Helix Pay's voluntary APP fraud protection scheme. The reimbursement amount may be adjusted based on the account holder's degree of negligence as determined by the investigation.

SECTION 5 — ESCALATION AND REGULATORY REPORTING

Cases that cannot be resolved through the standard investigation process are escalated to Helix Pay's Financial Crimes unit. Helix Pay files Suspicious Activity Reports with the relevant regulatory body as required by applicable law. Account holders involved in escalated cases will be notified of the process and their rights to an independent review.`,
  },

  // ── doc-disputes ───────────────────────────────────────────────────────────
  {
    id: 'doc-disputes',
    title: 'Helix Pay — Filing a Dispute: Step-by-Step Guide',
    type: 'support',
    version: '2024-11',
    body: `Helix Pay — How to File a Dispute

This guide explains the step-by-step process for filing a formal dispute under Helix Pay's refund and chargeback policy, including how to invoke your rights under Section 420.

BEFORE YOU BEGIN

Gather the following information before starting your dispute: the transaction date and amount, the name of the merchant or recipient, a description of why the transaction is disputed, and any supporting documentation such as receipts, communications, or screenshots.

HOW TO FILE UNDER SECTION 420

To file a formal dispute under Section 420 of the Helix Pay Refund and Chargeback Policy, follow these steps:

Step 1. Log in to your Helix Pay account at helixpay.com or through the Helix Pay mobile app.

Step 2. Navigate to the Activity section and locate the transaction you wish to dispute. Click or tap on the transaction to open the detail view.

Step 3. Select the Dispute This Transaction option. You will be asked to choose a dispute reason from the following categories: Unauthorized Transaction, Duplicate Charge, Item Not Received, Significantly Not as Described, or Other.

Step 4. Complete the dispute form. Provide a clear, factual description of the issue. Attach any supporting documentation. If you are invoking Section 420, select the Formal Dispute option on the submission screen.

Step 5. Review your submission and confirm. You will receive a confirmation email with a dispute reference number within fifteen minutes.

Step 6. Monitor the status of your dispute through the Disputes tab in your Helix Pay account. You will be notified at each stage of the investigation.

DISPUTE OUTCOMES

If your dispute is upheld, a credit will be issued to your original payment method within ten business days. If your dispute is not upheld, you will receive a written explanation of the decision, including the specific evidence reviewed. You have the right to request a secondary review within fifteen calendar days of the initial decision.`,
  },

  // ── doc-payouts ────────────────────────────────────────────────────────────
  {
    id: 'doc-payouts',
    title: 'Helix Pay — Payout Schedule & Timing',
    type: 'support',
    version: '2024-11',
    body: `Helix Pay — Payout Schedule and Timing

This document explains when and how payouts are processed for Helix Pay merchants and service providers.

STANDARD PAYOUT TIMELINE

Helix Pay processes payouts on a rolling two-business-day cycle. Funds from transactions settled before 5:00 PM Eastern Time on a given business day are included in the payout batch for that day and will be available in the recipient's linked bank account within two business days. For example, transactions settled on Monday will arrive in the bank account by Wednesday, assuming no banking holidays intervene.

This two-business-day timeline represents a significant improvement over Helix Pay's previous five-business-day schedule, which was retired as of version 2024-11 of this policy following infrastructure upgrades to Helix Pay's payment processing network.

FACTORS THAT AFFECT PAYOUT TIMING

Several circumstances may extend the standard two-business-day payout window. New accounts may be subject to a thirty-day hold on their initial payouts as part of Helix Pay's onboarding verification process. Accounts flagged for unusual transaction patterns may have payouts held pending review. Payouts to certain international bank accounts may take an additional one to three business days due to intermediary bank processing.

INSTANT PAYOUTS

Eligible merchants may opt in to Helix Pay's Instant Payout feature, which delivers funds to the recipient's debit card within thirty minutes of settlement, subject to eligibility requirements and a nominal processing fee. Instant Payouts are available twenty-four hours a day, seven days a week, including banking holidays.

PAYOUT NOTIFICATIONS

Helix Pay sends an email notification each time a payout is initiated. The notification includes the payout amount, the destination account (last four digits), and the expected arrival date. If a payout is delayed for any reason, Helix Pay will send a separate notification explaining the reason for the delay.`,
  },

  // ── doc-kyc ────────────────────────────────────────────────────────────────
  {
    id: 'doc-kyc',
    title: 'Helix Pay — KYC & Identity Verification',
    type: 'policy',
    version: '2024-11',
    body: `Helix Pay — Know Your Customer (KYC) and Identity Verification Policy

Helix Pay is required by law to verify the identity of all account holders before enabling full platform functionality. This policy explains what information is required, how it is verified, and what happens if verification is not completed.

WHY WE VERIFY YOUR IDENTITY

Identity verification is a legal requirement under anti-money laundering (AML) and counter-terrorist financing (CTF) regulations applicable in all jurisdictions where Helix Pay operates. Verification protects account holders from identity theft, protects the financial system from abuse, and enables Helix Pay to comply with its regulatory obligations.

WHAT YOU NEED TO PROVIDE

To complete identity verification, account holders must provide: a government-issued photo ID (passport, national identity card, or driver's license); proof of residential address dated within the last three months (such as a utility bill, bank statement, or official government correspondence); and in some cases, a selfie or short video for biometric verification.

VERIFICATION PROCESS

Documents are reviewed by Helix Pay's automated verification system, which checks for document authenticity, readable text, and consistency with the information on file. Most verifications are completed within five minutes. Complex cases may be referred to a human reviewer and can take up to two business days.

UNVERIFIED ACCOUNTS

Account holders who have not completed verification may send and receive payments up to a limited threshold. Once this threshold is reached, further transactions will be blocked until verification is completed. Helix Pay will send reminders via email and in-app notification as the threshold approaches.

DATA RETENTION

Identity verification documents are retained by Helix Pay for the duration required by applicable regulations, typically five to seven years from account closure. Documents are stored encrypted and access is restricted to authorized personnel.`,
  },

  // ── doc-api-changelog ──────────────────────────────────────────────────────
  // CRITICAL: Contains TWO payout-timing facts. The stale entry (2024-03)
  // says "5 business days"; the fresh entry (2024-11) says "2 business days".
  // Mission 7 injects the stale version of this document.
  {
    id: 'doc-api-changelog',
    title: 'Helix Pay — API & Policy Changelog',
    type: 'changelog',
    version: '2024-11',
    body: `Helix Pay API and Policy Changelog

This changelog records significant updates to the Helix Pay platform, API, and policy documents. Entries are listed in reverse chronological order.

─────────────────────────────────────
VERSION 2024-11 (November 2024)
─────────────────────────────────────

PAYOUT TIMING UPDATE — REDUCED TO 2 BUSINESS DAYS
Effective with this release, the standard payout processing time has been reduced from five business days to two business days. This change applies to all eligible merchant accounts and reflects infrastructure improvements to Helix Pay's payment processing network. The previous five-business-day timeline described in older documentation is no longer applicable. Merchants should update any customer-facing materials that reference the old payout timeline.

SECTION 420 DISPUTE WINDOW EXTENDED
The formal dispute filing window under Section 420 has been extended from thirty calendar days to forty-five calendar days from the transaction posting date, providing account holders with additional time to identify and report disputed transactions.

APP FRAUD REIMBURSEMENT FRAMEWORK INTRODUCED
Helix Pay has introduced a voluntary Authorized Push Payment (APP) fraud reimbursement framework. Eligible account holders who are deceived into authorizing a fraudulent payment may now apply for reimbursement under this framework, subject to eligibility criteria.

─────────────────────────────────────
VERSION 2024-03 (March 2024)
─────────────────────────────────────

PAYOUT TIMING — 5 BUSINESS DAYS (SUPERSEDED)
At this release, the standard payout processing time was five business days from the settlement date. Payouts were processed in daily batches at 5:00 PM Eastern Time. Note: this timeline has since been superseded by the 2024-11 update, which reduced payout timing to two business days.

DISPUTE WINDOW SET TO 30 DAYS
The formal dispute window under Section 420 was set at thirty calendar days from the transaction posting date. This has since been extended to forty-five days in the 2024-11 update.

INSTANT PAYOUT FEATURE LAUNCHED
Helix Pay launched the Instant Payout feature for eligible debit card recipients, providing same-session fund delivery for a nominal fee.

─────────────────────────────────────
VERSION 2023-09 (September 2023)
─────────────────────────────────────

KYC BIOMETRIC VERIFICATION ADDED
Helix Pay introduced optional biometric selfie verification for identity checking, reducing manual review times for complex verification cases.

TWO-FACTOR AUTHENTICATION MADE MANDATORY
Two-factor authentication (2FA) was made mandatory for all account holders, replacing the previous opt-in configuration.`,
  },

  // ── doc-fees ───────────────────────────────────────────────────────────────
  {
    id: 'doc-fees',
    title: 'Helix Pay — Fee Schedule',
    type: 'policy',
    version: '2024-11',
    body: `Helix Pay — Fee Schedule

This document sets out the fees applicable to Helix Pay accounts and transactions. All fees are quoted in the account's base currency unless otherwise stated.

STANDARD TRANSACTION FEES

Domestic payments between Helix Pay accounts are free of charge. Payments to external bank accounts are subject to a flat fee of zero point five percent of the transaction amount, with a minimum fee of fifty cents and a maximum fee of ten dollars per transaction. International transfers are subject to a fee of one point five percent of the transaction amount plus a fixed cross-border processing fee of two dollars and fifty cents.

REFUND AND CHARGEBACK FEES

Helix Pay does not charge account holders a fee for submitting refund requests. Merchants who receive a chargeback may be subject to a chargeback processing fee of fifteen dollars per chargeback. This fee is waived if the chargeback is resolved in the merchant's favor within the first dispute stage.

INSTANT PAYOUT FEES

The Instant Payout feature, which delivers funds to an eligible debit card within thirty minutes, is subject to a processing fee of one percent of the payout amount, with a minimum fee of twenty-five cents. The standard two-business-day payout is free of charge.

ACCOUNT MAINTENANCE FEES

Standard Helix Pay accounts have no monthly maintenance fee. Premium accounts, which offer higher transaction limits, dedicated support, and advanced reporting features, are available for a monthly fee of twenty-nine dollars and ninety-nine cents.

INACTIVITY FEE

Accounts with no transaction activity for a period of eighteen consecutive months may be subject to a monthly inactivity fee of five dollars, up to the available account balance. Account holders will be notified by email sixty days before the inactivity fee begins accruing and can reactivate their account by completing at least one transaction.`,
  },

  // ── doc-security ───────────────────────────────────────────────────────────
  {
    id: 'doc-security',
    title: 'Helix Pay — Account Security & 2FA',
    type: 'support',
    version: '2024-11',
    body: `Helix Pay — Account Security and Two-Factor Authentication

Your account security is a shared responsibility between you and Helix Pay. This guide explains the security measures Helix Pay provides and the steps you should take to protect your account.

TWO-FACTOR AUTHENTICATION (2FA)

Two-factor authentication is mandatory for all Helix Pay accounts. When enabled, logging in or authorizing high-value transactions requires both your password and a one-time code delivered to your registered mobile device or authentication app. Helix Pay supports the following 2FA methods: SMS text message codes, authenticator app codes (compatible with Google Authenticator, Authy, and similar apps), and hardware security keys (FIDO2/WebAuthn standard).

We strongly recommend using an authenticator app or hardware key rather than SMS, as SMS-based 2FA is vulnerable to SIM-swapping attacks. To upgrade your 2FA method, log in to your account, navigate to Security Settings, and follow the prompts.

PROTECTING YOUR CREDENTIALS

Never share your Helix Pay password or 2FA codes with anyone, including individuals claiming to be Helix Pay representatives. Helix Pay will never ask for your password or one-time codes by phone, email, or chat. Use a unique, strong password for your Helix Pay account that you do not use for any other service. If you believe your credentials have been compromised, change your password immediately and contact Helix Pay Security.

SUSPICIOUS ACTIVITY ALERTS

Helix Pay monitors your account for suspicious activity and will send you an alert if: you log in from a new device or location, a transaction is attempted outside your normal pattern, your password is changed, or a new payment method is added. Review these alerts promptly. If you receive an alert for activity you do not recognize, contact Helix Pay Security immediately.

REPORTING SECURITY CONCERNS

To report a security concern or suspected account compromise, contact Helix Pay Security through the in-app Help Center or call the Security Hotline listed in your account settings. Security reports are treated as high priority and are reviewed within four hours during business hours and within twelve hours outside business hours.`,
  },
]

// ── Stale version of doc-api-changelog (Mission 7 injection) ─────────────────
// Replaces the fresh doc in the Mission 7 index — the stale entry says 5 days.
export const STALE_CHANGELOG: Document = {
  id: 'doc-api-changelog',
  title: 'Helix Pay — API & Policy Changelog',
  type: 'changelog',
  version: '2024-03',
  body: `Helix Pay API and Policy Changelog

This changelog records significant updates to the Helix Pay platform, API, and policy documents. Entries are listed in reverse chronological order.

─────────────────────────────────────
VERSION 2024-03 (March 2024) — CURRENT
─────────────────────────────────────

PAYOUT TIMING — 5 BUSINESS DAYS
The standard payout processing time is five business days from the settlement date. Payouts are processed in daily batches at 5:00 PM Eastern Time. Funds from transactions settled on a given business day are included in that day's payout batch and will arrive in the recipient's bank account within five business days.

DISPUTE WINDOW SET TO 30 DAYS
The formal dispute window under Section 420 is thirty calendar days from the transaction posting date.

INSTANT PAYOUT FEATURE LAUNCHED
Helix Pay launched the Instant Payout feature for eligible debit card recipients. Standard payout timing remains five business days.

─────────────────────────────────────
VERSION 2023-09 (September 2023)
─────────────────────────────────────

KYC BIOMETRIC VERIFICATION ADDED
Helix Pay introduced optional biometric selfie verification for identity checking.

TWO-FACTOR AUTHENTICATION MADE MANDATORY
Two-factor authentication (2FA) was made mandatory for all account holders.`,
}

export function getCorpusForMission(injection: string): Document[] {
  if (injection === 'staleIndex') {
    return CORPUS.map(d => d.id === 'doc-api-changelog' ? STALE_CHANGELOG : d)
  }
  return CORPUS
}
