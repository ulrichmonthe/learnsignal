// RAG Lab query definitions with gold labels and gold spans.
// Gold spans are character offsets into Document.body, computed from the ACTUAL
// evidence phrases in the corpus (see scripts/recalibrate.ts). chunk.start/end
// are real body offsets (lib/rag-lab/chunk.ts), so spans and chunks share one
// coordinate system and grounding keys off the true supporting text.

import type { Query } from './types'

export const QUERIES: Query[] = [

  // ── q-liability ─────────────────────────────────────────────────────────────
  // Two claims in DIFFERENT sections of doc-fraud (Section 3 liability @2729,
  // Section 4 APP reimbursement @3757). With topK=1 only one gold chunk is fed,
  // so the other claim is hallucinated — the Mission 1 "retrieval failure".
  {
    id: 'q-liability',
    text: 'Who is liable if a user is tricked into authorizing a payment?',
    goldAnswer: 'When an account holder is tricked into authorizing a payment (APP fraud), Helix Pay investigates the claim. Account holders who report promptly, did not act with gross negligence, and cooperate fully are eligible for reimbursement under the APP fraud protection scheme.',
    goldClaims: [
      {
        // Large evidence span (261 chars) that straddles small-chunk boundaries:
        // it is split (and the claim hallucinated) until chunk size/overlap grows
        // enough to land it in a single chunk — the Mission 2 lesson.
        text: 'The account holder bears no liability for unauthorized transactions when the investigation confirms the transaction was not authorized by them.',
        goldSpan: { docId: 'doc-fraud', start: 2565, end: 2826 },
        distractorText: 'The merchant is fully liable for any unauthorized transaction regardless of the account holder\'s actions.',
      },
      {
        text: 'Account holders who cooperate with investigation and report APP fraud promptly are eligible for reimbursement.',
        goldSpan: { docId: 'doc-fraud', start: 3757, end: 3839 },
        distractorText: 'APP fraud claims are not covered by Helix Pay\'s liability framework.',
      },
    ],
    goldSpans: [
      { docId: 'doc-fraud', start: 2565, end: 2826 },
      { docId: 'doc-fraud', start: 3757, end: 3839 },
    ],
    kind: 'semantic',
  },

  // ── q-section420 ────────────────────────────────────────────────────────────
  {
    id: 'q-section420',
    text: 'What does Section 420 say about refunds?',
    goldAnswer: 'Section 420 of the Helix Pay Refund and Chargeback Policy governs the formal dispute process. Account holders may file a formal dispute within 45 calendar days of a transaction posting. If resolved in the account holder\'s favor, a full credit is issued within 10 business days.',
    goldClaims: [
      {
        text: 'Section 420 allows account holders to file a formal dispute within 45 calendar days.',
        goldSpan: { docId: 'doc-refunds', start: 1448, end: 1501 },
        distractorText: 'Section 420 requires disputes to be filed within 10 business days.',
      },
    ],
    goldSpans: [
      { docId: 'doc-refunds', start: 1448, end: 1501 },
    ],
    kind: 'exact',
  },

  // ── q-lies-for-money ────────────────────────────────────────────────────────
  // NO lexical overlap between query and gold doc text.
  // Query: "lies to get a refund they don't deserve"
  // Doc:   "knowingly provide inaccurate information ... to obtain a credit ... request denied"
  {
    id: 'q-lies-for-money',
    text: "What if someone lies to get a refund they don't deserve?",
    goldAnswer: "Customers who knowingly provide inaccurate information to obtain a credit will have their request denied. Deliberate misrepresentation may result in account suspension and referral to Helix Pay's fraud prevention team.",
    goldClaims: [
      {
        text: 'Customers who deliberately misrepresent a transaction to obtain a refund face account suspension and fraud referral.',
        goldSpan: { docId: 'doc-refunds', start: 1978, end: 2139 },
        distractorText: 'Helix Pay refunds all claims without verification.',
      },
    ],
    goldSpans: [
      { docId: 'doc-refunds', start: 1978, end: 2139 },
    ],
    kind: 'semantic',
  },

  // ── q-payout-timing ─────────────────────────────────────────────────────────
  // Gold answer: "2 business days" (version 2024-11).
  // Stale index returns "5 business days" (version 2024-03) — Mission 7 trap.
  {
    id: 'q-payout-timing',
    text: 'How long do payouts take?',
    goldAnswer: 'Helix Pay processes payouts on a two-business-day cycle. Funds from transactions settled before 5:00 PM Eastern Time are available in the recipient\'s bank account within two business days.',
    goldClaims: [
      {
        text: 'Standard payouts are delivered within two business days.',
        goldSpan: { docId: 'doc-payouts', start: 379, end: 452 },
        distractorText: 'Standard payouts are delivered within five business days.',
      },
    ],
    goldSpans: [
      { docId: 'doc-payouts', start: 379, end: 452 },
    ],
    kind: 'semantic',
  },

  // ── q-refund-then-liability ──────────────────────────────────────────────────
  // Multi-hop: hop 1 → doc-refunds (refund denied = fraud), hop 2 → doc-fraud (liability).
  {
    id: 'q-refund-then-liability',
    text: 'If my refund is denied because of fraud, am I still liable?',
    goldAnswer: 'If Helix Pay denies a refund because fraud is detected on the account, liability depends on the investigation findings. Where the account holder did not authorize the transaction and reported it promptly, they bear no liability. Where the account holder contributed to the activity, partial liability may apply.',
    goldClaims: [
      {
        text: 'Refunds may be denied when fraud is detected on the account.',
        goldSpan: { docId: 'doc-refunds', start: 1978, end: 2139 },
        distractorText: 'All refunds are automatically approved regardless of fraud.',
      },
      {
        text: 'Account holders who did not authorize the transaction bear no liability.',
        goldSpan: { docId: 'doc-fraud', start: 2729, end: 2780 },
        distractorText: 'Account holders are always fully liable when fraud occurs.',
      },
    ],
    goldSpans: [
      { docId: 'doc-refunds', start: 1978, end: 2139 },
      { docId: 'doc-fraud', start: 2729, end: 2780 },
    ],
    kind: 'multi-hop',
  },

  // ── q-instant-payout ────────────────────────────────────────────────────────
  {
    id: 'q-instant-payout',
    text: 'Is there a faster payout option than the standard timeline?',
    goldAnswer: 'Yes. Helix Pay offers an Instant Payout feature that delivers funds to an eligible debit card within thirty minutes of settlement, available 24/7 including holidays, subject to a nominal processing fee.',
    goldClaims: [
      {
        text: 'Instant Payout delivers funds within thirty minutes for a fee.',
        goldSpan: { docId: 'doc-payouts', start: 1443, end: 1478 },
        distractorText: 'There is no faster payout option than standard.',
      },
    ],
    goldSpans: [{ docId: 'doc-payouts', start: 1443, end: 1478 }],
    kind: 'semantic',
  },

  // ── q-2fa-methods ────────────────────────────────────────────────────────────
  {
    id: 'q-2fa-methods',
    text: 'What 2FA methods does Helix Pay support?',
    goldAnswer: 'Helix Pay supports SMS text message codes, authenticator app codes (compatible with Google Authenticator, Authy, and similar), and hardware security keys (FIDO2/WebAuthn). Authenticator apps or hardware keys are recommended over SMS.',
    goldClaims: [
      {
        text: 'Helix Pay supports SMS, authenticator app codes, and hardware security keys for 2FA.',
        goldSpan: { docId: 'doc-security', start: 577, end: 624 },
        distractorText: 'Helix Pay only supports SMS codes for two-factor authentication.',
      },
    ],
    goldSpans: [{ docId: 'doc-security', start: 577, end: 624 }],
    kind: 'exact',
  },

  // ── q-kyc-docs ──────────────────────────────────────────────────────────────
  {
    id: 'q-kyc-docs',
    text: 'What documents do I need for identity verification?',
    goldAnswer: 'To complete KYC verification on Helix Pay you need: a government-issued photo ID (passport, national ID, or driver\'s license), proof of residential address dated within the last three months, and in some cases a selfie or video for biometric verification.',
    goldClaims: [
      {
        text: 'KYC requires a government-issued photo ID and proof of address.',
        goldSpan: { docId: 'doc-kyc', start: 790, end: 872 },
        distractorText: 'No documents are required for identity verification.',
      },
    ],
    goldSpans: [{ docId: 'doc-kyc', start: 790, end: 872 }],
    kind: 'semantic',
  },

  // ── q-chargeback-fee ─────────────────────────────────────────────────────────
  {
    id: 'q-chargeback-fee',
    text: 'How much does a chargeback cost the merchant?',
    goldAnswer: 'Merchants who receive a chargeback may be subject to a chargeback processing fee of fifteen dollars per chargeback. This fee is waived if the chargeback is resolved in the merchant\'s favor within the first dispute stage.',
    goldClaims: [
      {
        text: 'The chargeback fee is $15, waived if the merchant wins at the first stage.',
        goldSpan: { docId: 'doc-fees', start: 811, end: 870 },
        distractorText: 'There is no fee for chargebacks.',
      },
    ],
    goldSpans: [{ docId: 'doc-fees', start: 811, end: 870 }],
    kind: 'exact',
  },

  // ── q-unverified-limit ───────────────────────────────────────────────────────
  {
    id: 'q-unverified-limit',
    text: 'What happens if I haven\'t completed identity verification?',
    goldAnswer: 'Unverified Helix Pay accounts can send and receive payments up to a limited threshold. Once this threshold is reached, further transactions are blocked until KYC verification is completed.',
    goldClaims: [
      {
        text: 'Unverified accounts have a transaction threshold; further transactions are blocked until verification.',
        goldSpan: { docId: 'doc-kyc', start: 1588, end: 1643 },
        distractorText: 'Unverified accounts have no restrictions.',
      },
    ],
    goldSpans: [{ docId: 'doc-kyc', start: 1588, end: 1643 }],
    kind: 'semantic',
  },

  // ── q-refund-timeline ────────────────────────────────────────────────────────
  {
    id: 'q-refund-timeline',
    text: 'How long does it take to get a refund approved?',
    goldAnswer: 'Standard refund requests are processed within seven to ten business days from the date the request is approved. Chargeback requests filed under Section 420 follow the dispute investigation timeline, which may extend up to thirty business days.',
    goldClaims: [
      {
        text: 'Standard refunds take 7–10 business days; Section 420 disputes may take up to 30 days.',
        goldSpan: { docId: 'doc-refunds', start: 2714, end: 2757 },
        distractorText: 'All refunds are processed within 24 hours.',
      },
    ],
    goldSpans: [{ docId: 'doc-refunds', start: 2714, end: 2757 }],
    kind: 'semantic',
  },

  // ── q-security-alert ─────────────────────────────────────────────────────────
  {
    id: 'q-security-alert',
    text: 'Will Helix Pay notify me if someone logs in from a new device?',
    goldAnswer: 'Yes. Helix Pay sends suspicious activity alerts for login from a new device or location, unusual transaction patterns, password changes, and new payment method additions.',
    goldClaims: [
      {
        text: 'Helix Pay sends alerts for new device logins and other suspicious activity.',
        goldSpan: { docId: 'doc-security', start: 1569, end: 1609 },
        distractorText: 'Helix Pay does not send notifications for new device logins.',
      },
    ],
    goldSpans: [{ docId: 'doc-security', start: 1569, end: 1609 }],
    kind: 'semantic',
  },
]

// ── Drift query sets (Mission 8) ──────────────────────────────────────────────
// driftTestSet: clean phrasing that matches corpus vocabulary well
// driftProdSet: messy real-world phrasing with low lexical overlap
export const DRIFT_TEST_SET: Query[] = [
  QUERIES.find(q => q.id === 'q-payout-timing')!,
  QUERIES.find(q => q.id === 'q-2fa-methods')!,
  QUERIES.find(q => q.id === 'q-kyc-docs')!,
]

export const DRIFT_PROD_SET: Query[] = [
  {
    id: 'q-payout-timing-drift',
    text: 'when does the money show up',
    goldAnswer: QUERIES.find(q => q.id === 'q-payout-timing')!.goldAnswer,
    goldClaims: QUERIES.find(q => q.id === 'q-payout-timing')!.goldClaims,
    goldSpans: QUERIES.find(q => q.id === 'q-payout-timing')!.goldSpans,
    kind: 'semantic',
  },
  {
    id: 'q-2fa-drift',
    text: 'how do i set up the code thing for logging in',
    goldAnswer: QUERIES.find(q => q.id === 'q-2fa-methods')!.goldAnswer,
    goldClaims: QUERIES.find(q => q.id === 'q-2fa-methods')!.goldClaims,
    goldSpans: QUERIES.find(q => q.id === 'q-2fa-methods')!.goldSpans,
    kind: 'semantic',
  },
  {
    id: 'q-kyc-drift',
    text: 'what do u need to prove who i am',
    goldAnswer: QUERIES.find(q => q.id === 'q-kyc-docs')!.goldAnswer,
    goldClaims: QUERIES.find(q => q.id === 'q-kyc-docs')!.goldClaims,
    goldSpans: QUERIES.find(q => q.id === 'q-kyc-docs')!.goldSpans,
    kind: 'semantic',
  },
]

export const EVAL_SET: Query[] = [
  QUERIES.find(q => q.id === 'q-liability')!,
  QUERIES.find(q => q.id === 'q-section420')!,
  QUERIES.find(q => q.id === 'q-lies-for-money')!,
  QUERIES.find(q => q.id === 'q-payout-timing')!,
  QUERIES.find(q => q.id === 'q-2fa-methods')!,
  QUERIES.find(q => q.id === 'q-kyc-docs')!,
]

export function getQueryById(id: string): Query | undefined {
  return [...QUERIES, ...DRIFT_PROD_SET].find(q => q.id === id)
}
