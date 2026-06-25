"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type FAQ = { q: string; a: string };
type Stat = { number: string; label: string; source: string };
type FailureNode = { label: string; sub: string; color: string };
type Question = {
  number: string;
  heading: string;
  directAnswer: string;
  body: string;
  expandTitle: string;
  expandBody: string[];
};
type ChecklistItem = { question: string; hint: string };

const META = {
  title: "Why AI features fail at the product layer, not the model",
  description:
    "95% of GenAI pilots produce zero business impact. The failure is almost never the model — it's undefined success metrics, poor workflow integration, and PMs treating the LLM as the product.",
  slug: "why-ai-features-fail-product-layer",
  author: "LearnSignal",
  publishedDate: "2026-04-14",
  modifiedDate: "2026-04-14",
  category: "Practice",
  primaryKeyword: "AI features fail product layer",
  readingTime: "8 min read",
  canonicalUrl: "https://learnsignal.ai/signals/why-ai-features-fail-product-layer",
  ogImage: "https://learnsignal.ai/og/why-ai-features-fail-product-layer.png",
};

const FAQ_DATA: FAQ[] = [
  {
    q: "Why do most AI features fail in production?",
    a: "Most AI features fail because of product decisions, not model quality. Teams start with the technology instead of the problem, skip workflow integration, and measure model performance instead of user outcomes. MIT research found 95% of GenAI pilots produced zero measurable business impact.",
  },
  {
    q: "What is the product layer failure in AI development?",
    a: "The product layer failure is when an AI feature fails due to poor product decisions — undefined success metrics, features that don't integrate into user workflows, bad training data governance, or no trust design — rather than technical model limitations.",
  },
  {
    q: "How do I know if my AI feature has a product problem or a model problem?",
    a: "Ask five questions: Did you start with the problem or the model? Do you know who labelled your training data? Does the feature live inside the user's workflow? Can users tell when the AI is wrong? Are you measuring user outcomes, not model metrics? Two or more 'no' answers indicate a product problem.",
  },
  {
    q: "When should I upgrade my AI model vs fix the product?",
    a: "Upgrade the model only after ruling out product-layer failures. If you haven't defined user outcome metrics, integrated the feature into the workflow, or designed for AI errors, a better model will not fix the problem. Fix the product decisions first.",
  },
  {
    q: "What does workflow integration mean for AI product managers?",
    a: "Workflow integration means the AI feature is built inside the tool users already have open, triggered by actions they're already taking, and returns results in the context where they're needed — not as a separate tool users must remember to visit.",
  },
];

const STATS: Stat[] = [
  {
    number: "95%",
    label: "of GenAI pilots produced zero measurable P&L impact",
    source: "MIT Project NANDA, 2025",
  },
  {
    number: "42%",
    label: "of companies abandoned most AI initiatives in 2025",
    source: "S&P Global Market Intelligence, 2026",
  },
  {
    number: "21%",
    label: "of orgs redesigned workflows — the #1 driver of AI value",
    source: "McKinsey State of AI, 2025",
  },
];

const FAILURE_NODES: FailureNode[] = [
  { label: "Wrong problem", sub: "Started with model", color: "#E8593C" },
  { label: "Bad data", sub: "Assumptions unlabelled", color: "#BA7517" },
  { label: "Workflow miss", sub: "Feature sits alongside", color: "#534AB7" },
  { label: "No trust", sub: "Users disengage", color: "#0F6E56" },
  { label: "Wrong metrics", sub: "Failure invisible", color: "#5F5E5A" },
];

const QUESTIONS: Question[] = [
  {
    number: "01",
    heading: "Did you start with the problem or the model?",
    directAnswer:
      "Most AI features fail because they begin with a capability, not a user problem. Starting with the model means every downstream decision — data, workflow, metrics — inherits the wrong frame.",
    body: "A capability is not a problem. Before architecture, before data, before a single prompt is written, the question is whether a specific user has a specific painful problem this approach uniquely solves — and whether that problem was identified before the technology was chosen. Most AI features begin with a capability and work backwards to a use case. The entire product then gets built to serve the technology rather than the user.",
    expandTitle: "Real-world pattern",
    expandBody: [
      "The team sees that LLMs can summarise documents. They build a summarisation feature. Nobody asked whether users needed summaries, whether they trusted AI summaries, or whether reading a summary would actually save time. The model does exactly what it was designed to do. The product answers a question nobody had.",
      "The fix is simple and almost always skipped: write the problem statement before the technical spec. One sentence. \"A [specific user] needs to [do specific thing] because [specific friction].\" If you can't write that sentence, you're not ready to choose a model.",
    ],
  },
  {
    number: "02",
    heading: "Do you know who labelled your training data?",
    directAnswer:
      "Bad training data is a product design problem, not a technical one. The PM owns the question of what assumptions are baked into the labelling process — not the ML engineer.",
    body: "No model rescues bad data. IBM's Watson for oncology cost MD Anderson $62 million before the project was abandoned. Internal documents showed the model had been trained on hypothetical patient cases rather than real ones. The labelling process reflected assumptions nobody had examined. This question belongs to the PM, not the ML engineer. Who collected the training examples? What instructions did they receive? What edge cases were excluded because nobody thought to include them? The outputs your model produces are a direct reflection of what your labelling process assumed the world looks like.",
    expandTitle: "What to ask your ML team",
    expandBody: [
      "Three questions every PM should be able to answer before launch: Who collected the training examples and what instructions did they receive? What edge cases were excluded because nobody thought to include them? How does the distribution of training data compare to the distribution of real production inputs?",
      "If your ML engineer can't answer these in plain language, that's not a communication problem. It's a data governance problem. And it belongs on your PRD, not theirs.",
    ],
  },
  {
    number: "03",
    heading: "Does this feature live inside how your users actually work?",
    directAnswer:
      "AI features fail when they sit alongside workflows instead of inside them. McKinsey found workflow integration is the single strongest predictor of AI generating measurable business value — stronger than model choice, data quality, or team size.",
    body: "A feature that requires users to navigate to it, switch context to use it, or remember it exists is a workflow interruption, not a workflow feature. Adoption of workflow interruptions depends entirely on whether the value is strong enough to replace an existing habit. Most AI features aren't. The ones generating real returns are built into the moment of work — inside the tool already open, triggered by the action already happening, returning a result in the context where it's needed. If your feature requires a behaviour change to use, upgrading the model will not fix it.",
    expandTitle: "The workflow integration test",
    expandBody: [
      "The test is blunt: shadow a user for 30 minutes doing the task your feature is supposed to help with. Count how many times they naturally open the tool where your feature lives. If the answer is zero or one, your feature is not in the workflow — it's adjacent to it.",
      "Location is not a UX decision. It's a product decision. A feature that lives where users already are doesn't need to be discovered. A feature that doesn't will always underperform its model.",
    ],
  },
  {
    number: "04",
    heading: "Can your users tell when the AI is wrong?",
    directAnswer:
      "Trust design — how the system signals uncertainty and lets users recover from errors — is the product decision most teams skip. Without it, every AI failure erodes trust permanently rather than temporarily.",
    body: "Taco Bell's Voice AI ran at 99.9% uptime. By every technical reliability metric, it was a success. The company's own CDO eventually admitted it let customers down. Uptime is a model metric. Customer experience is a product decision. Trust design — how transparent the system is about its own uncertainty, how easily users can override or correct it, what happens when it fails — is a set of decisions most teams skip entirely because they're not in the model spec.",
    expandTitle: "Designing for failure, not just success",
    expandBody: [
      "Users don't need the AI to be perfect. They need to know when it isn't, and they need a way to act on that information. Three design decisions that almost never make it into the spec: How does the interface signal low-confidence outputs? What does the user do when the AI is wrong? What happens to that correction — does anyone learn from it?",
      "Every AI failure that isn't recoverable erodes trust permanently rather than temporarily. Recovery UX is not a nice-to-have. For high-frequency features, it determines whether the product compounds or decays.",
    ],
  },
  {
    number: "05",
    heading: "Are you measuring user outcomes or model performance?",
    directAnswer:
      "A feature can score well on every model metric — accuracy, latency, hallucination rate — and fail every user outcome metric simultaneously. The QBR blames the model because model metrics are what got instrumented.",
    body: "Accuracy, latency, hallucination rate — these tell you whether the model performs as designed. They tell you nothing about whether the feature works. The metrics that belong to the PM are one layer up: did the user complete the task faster, make a better decision, come back the next day? A feature can score well on every model metric and fail every user outcome metric simultaneously. The QBR will still blame the model, because model metrics are the ones that got instrumented. Decide before you ship what user outcome you are trying to move. Build that metric before you build the feature.",
    expandTitle: "The metric that belongs to the PM",
    expandBody: [
      "Before you build, decide the single user outcome metric that will tell you whether this feature works. Not a model metric. A user metric. Did they complete the task faster? Make a better decision? Come back the next day? If that number doesn't exist yet, build it before you build the feature.",
      "Andrew Ng said at AI Startup School in 2025 that product management is now the bottleneck. This is one reason why: engineering can instrument model performance in hours. Defining what user success actually looks like — that takes a PM.",
    ],
  },
];

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    question: "Did you start with the problem or the model?",
    hint: "The feature began with a capability, not a defined user problem",
  },
  {
    question:
      "Do you know who labelled your training data and what they never saw?",
    hint: "Nobody on the product team has reviewed the labelling instructions",
  },
  {
    question:
      "Does this feature live inside how your users work — or did you ask them to change?",
    hint: "Users have to navigate to it or change their workflow to use it",
  },
  {
    question:
      "Can your users tell when the AI is wrong — and do anything about it?",
    hint: "No confidence signals, no override mechanism, no recovery UX designed",
  },
  {
    question:
      "Are you measuring what the model does, or what the user achieves?",
    hint: "Success is defined by model metrics, not user outcome metrics",
  },
];

const PROGRESS_SECTIONS = [
  { name: "Introduction", threshold: 0 },
  { name: "The data", threshold: 12 },
  { name: "Collapse sequence", threshold: 25 },
  { name: "01 — Problem or model", threshold: 36 },
  { name: "02 — Training data", threshold: 48 },
  { name: "03 — Workflow", threshold: 58 },
  { name: "04 — Trust", threshold: 68 },
  { name: "05 — Metrics", threshold: 78 },
  { name: "Diagnostic", threshold: 88 },
  { name: "FAQ", threshold: 93 },
];

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  :root {
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --ls-accent: #C8F040;
    --ls-bg: #0D0D0D;
    --ls-surface: #161616;
    --ls-border: rgba(255,255,255,0.08);
    --ls-text: #F0EFE8;
    --ls-body: #C2C0B6;
    --ls-muted: #888780;
  }

  .ls-article * { box-sizing: border-box; }
  .ls-article { background: var(--ls-bg); font-family: var(--font-body); color: var(--ls-text); min-height: 100vh; }
  .ls-article p { font-size: 17px; line-height: 1.85; color: var(--ls-body); margin: 0 0 1.35rem; }
  .ls-article h2 { font-family: var(--font-body); font-size: 21px; font-weight: 600; color: var(--ls-text); line-height: 1.35; margin: 0 0 0.6rem; letter-spacing: -0.01em; }
  .ls-article h3 { font-family: var(--font-body); font-size: 17px; font-weight: 600; color: var(--ls-text); line-height: 1.4; margin: 0 0 0.5rem; }
  .ls-section-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ls-accent); margin-bottom: 1rem; }
`;

function ProgressBar({
  progress,
  sectionName,
}: {
  progress: number;
  sectionName: string;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--ls-bg)",
        borderBottom: "1px solid var(--ls-border)",
        padding: "10px 0 8px",
      }}
    >
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ls-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {sectionName}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ls-accent)" }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height: 2, background: "var(--ls-border)", borderRadius: 2 }}>
          <div
            style={{
              height: 2,
              background: "var(--ls-accent)",
              borderRadius: 2,
              width: `${progress}%`,
              transition: "width 0.2s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AnswerBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--ls-surface)",
        border: "1px solid var(--ls-border)",
        borderLeft: "3px solid var(--ls-accent)",
        borderRadius: "0 8px 8px 0",
        padding: "1.25rem 1.5rem",
        margin: "1.5rem 0 2rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ls-accent)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Answer
      </div>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ls-text)", margin: 0, fontWeight: 400 }}>
        {children}
      </p>
    </div>
  );
}

function StatGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "2.5rem 0" }}>
      {STATS.map((s) => (
        <div
          key={s.label}
          style={{
            background: "var(--ls-surface)",
            border: "1px solid var(--ls-border)",
            borderTop: "3px solid var(--ls-accent)",
            borderRadius: 8,
            padding: "1.25rem 1rem",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 30, fontWeight: 600, color: "var(--ls-accent)", lineHeight: 1, marginBottom: 8 }}>
            {s.number}
          </div>
          <div style={{ fontSize: 13, color: "var(--ls-text)", lineHeight: 1.5, marginBottom: 6 }}>
            {s.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ls-muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {s.source}
          </div>
        </div>
      ))}
    </div>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      style={{
        borderLeft: "3px solid var(--ls-accent)",
        margin: "2.5rem 0",
        padding: "1rem 1.5rem",
        background: "var(--ls-surface)",
        borderRadius: "0 8px 8px 0",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 20,
          fontWeight: 400,
          fontStyle: "italic",
          lineHeight: 1.55,
          color: "var(--ls-text)",
          margin: 0,
        }}
      >
        {children}
      </p>
    </blockquote>
  );
}

function CollapseFlow() {
  const nodeW = 108;
  const nodeH = 52;
  const gap = 16;
  const total = FAILURE_NODES.length;
  const totalW = total * nodeW + (total - 1) * gap;
  const startX = (680 - totalW) / 2;

  return (
    <svg width="100%" viewBox="0 0 680 250" style={{ display: "block", margin: "1.5rem 0 0.5rem" }}>
      <defs>
        <marker id="cf-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {FAILURE_NODES.map((node, i) => {
        const x = startX + i * (nodeW + gap);
        const cx = x + nodeW / 2;
        return (
          <g key={node.label}>
            <rect x={x} y={20} width={nodeW} height={nodeH} rx={8} fill={node.color} />
            <text
              x={cx}
              y={38}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: "DM Sans,sans-serif", fontSize: 12, fontWeight: 600, fill: "#fff" }}
            >
              {node.label}
            </text>
            <text
              x={cx}
              y={56}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: "DM Sans,sans-serif", fontSize: 10, fill: "rgba(255,255,255,0.8)" }}
            >
              {node.sub}
            </text>
            {i < total - 1 && (
              <line
                x1={x + nodeW}
                y1={20 + nodeH / 2}
                x2={x + nodeW + gap}
                y2={20 + nodeH / 2}
                stroke={node.color}
                strokeWidth={1.5}
                markerEnd="url(#cf-arr)"
              />
            )}
          </g>
        );
      })}
      <path
        d={`M ${startX + (total - 1) * (nodeW + gap) + nodeW / 2} ${20 + nodeH} L ${startX + (total - 1) * (nodeW + gap) + nodeW / 2} 120 L 340 120 L 340 138`}
        fill="none"
        stroke="#555"
        strokeWidth={1.2}
        strokeDasharray="4 3"
        markerEnd="url(#cf-arr)"
      />
      <rect x={215} y={140} width={250} height={52} rx={8} fill="#A32D2D" />
      <text x={340} y={160} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, fontWeight: 600, fill: "#fff" }}>
        QBR: blame the model
      </text>
      <text x={340} y={179} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "DM Sans,sans-serif", fontSize: 10, fill: "rgba(255,255,255,0.8)" }}>
        Failure misdiagnosed
      </text>
      <text x={340} y={222} textAnchor="middle" style={{ fontFamily: "DM Sans,sans-serif", fontSize: 11, fill: "#666", fontStyle: "italic" }}>
        Each failure enables the next. The collapse starts at problem definition.
      </text>
    </svg>
  );
}

function QuestionBlock({ q }: { q: Question }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--ls-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: "0.75rem" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ls-accent)",
            background: "var(--ls-surface)",
            border: "1px solid var(--ls-accent)",
            borderRadius: 4,
            padding: "3px 7px",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            marginTop: 3,
          }}
        >
          {q.number}
        </span>
        <h2
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.35,
            color: "var(--ls-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {q.heading}
        </h2>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ls-accent)", fontStyle: "italic", margin: "0 0 1rem", opacity: 0.9 }}>
        {q.directAnswer}
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.85, color: "var(--ls-body)", margin: "0 0 1rem" }}>{q.body}</p>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.05em",
          color: "var(--ls-muted)",
          background: "none",
          border: "1px solid var(--ls-border)",
          borderRadius: 6,
          padding: "6px 14px",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--ls-accent)";
          e.currentTarget.style.color = "var(--ls-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--ls-border)";
          e.currentTarget.style.color = "var(--ls-muted)";
        }}
      >
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block", fontSize: 9 }}>
          ▼
        </span>
        {q.expandTitle}
      </button>
      {open && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1.25rem 1.5rem",
            background: "var(--ls-surface)",
            border: "1px solid var(--ls-border)",
            borderLeft: "3px solid var(--ls-accent)",
            borderRadius: "0 8px 8px 0",
          }}
        >
          {q.expandBody.map((para, i) => (
            <p key={para} style={{ fontSize: 14, lineHeight: 1.75, color: "var(--ls-body)", margin: i < q.expandBody.length - 1 ? "0 0 0.85rem" : 0 }}>
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Checklist() {
  const [checked, setChecked] = useState<boolean[]>(
    Array(CHECKLIST_ITEMS.length).fill(false),
  );
  const toggle = (i: number) =>
    setChecked((prev) => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });
  const count = checked.filter(Boolean).length;
  const result =
    count === 0
      ? null
      : count <= 2
        ? {
            text: `${count} of 5 flagged. You have a product problem, not a model problem. These are fixable before launch — but only if you act on them.`,
            type: "warn" as const,
          }
        : {
            text: `${count} of 5 flagged. Stop. Do not upgrade the model. The failure is already baked into the product decisions. Start with question 01.`,
            type: "danger" as const,
          };

  return (
    <div
      style={{
        background: "var(--ls-surface)",
        border: "1px solid var(--ls-border)",
        borderRadius: 12,
        padding: "1.75rem",
        margin: "2.5rem 0",
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ls-accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        Diagnostic
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ls-text)", marginBottom: 4 }}>
        5-question checklist
      </div>
      <div style={{ fontSize: 14, color: "var(--ls-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
        Run this against your current project. Check the ones that made you uncomfortable.
      </div>
      {CHECKLIST_ITEMS.map((item, i) => (
        <div
          key={item.question}
          onClick={() => toggle(i)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "14px 0",
            borderBottom: i < CHECKLIST_ITEMS.length - 1 ? "1px solid var(--ls-border)" : "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              minWidth: 22,
              border: checked[i] ? "none" : "1.5px solid var(--ls-border)",
              borderRadius: 5,
              background: checked[i] ? "var(--ls-accent)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
              transition: "all 0.15s",
            }}
          >
            {checked[i] && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: checked[i] ? "var(--ls-muted)" : "var(--ls-text)",
                textDecoration: checked[i] ? "line-through" : "none",
                lineHeight: 1.4,
                marginBottom: 3,
                transition: "all 0.15s",
              }}
            >
              {item.question}
            </div>
            <div style={{ fontSize: 12, color: "var(--ls-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.4 }}>
              {item.hint}
            </div>
          </div>
        </div>
      ))}
      {result && (
        <div
          style={{
            marginTop: "1.25rem",
            padding: "1rem 1.25rem",
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.6,
            background: result.type === "danger" ? "rgba(163,45,45,0.08)" : "rgba(186,117,23,0.08)",
            border: `1px solid ${result.type === "danger" ? "rgba(163,45,45,0.35)" : "rgba(186,117,23,0.3)"}`,
            color: "var(--ls-text)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginRight: 8,
              color: result.type === "danger" ? "#f09090" : "#f0c040",
            }}
          >
            ⚠ {result.type === "danger" ? "Critical" : "Warning"}
          </span>
          {result.text}
        </div>
      )}
    </div>
  );
}

function FAQBlock() {
  return (
    <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--ls-border)" }}>
      <div className="ls-section-label">Frequently asked questions</div>
      {FAQ_DATA.map((faq) => (
        <div key={faq.q} style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ls-text)", margin: "0 0 0.5rem", lineHeight: 1.4 }}>
            {faq.q}
          </h3>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--ls-body)", margin: 0 }}>{faq.a}</p>
        </div>
      ))}
    </div>
  );
}

function WaitlistCTA() {
  return (
    <div
      style={{
        margin: "3rem 0 0",
        padding: "1.5rem",
        background: "var(--ls-surface)",
        border: "1px solid var(--ls-border)",
        borderTop: "3px solid var(--ls-accent)",
        borderRadius: "0 0 8px 8px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ls-accent)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        LearnSignal
      </div>
      <p style={{ fontSize: 16, color: "var(--ls-text)", margin: "0 0 1rem", lineHeight: 1.6, fontWeight: 500 }}>
        LearnSignal is building the training platform for AI PMs. If this resonated, join the waitlist.
      </p>
      <p style={{ fontSize: 14, color: "var(--ls-muted)", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
        Learn through real decision simulations - not lectures or frameworks. Every scenario puts you inside a real AI PM decision before the technique is explained.
      </p>
      <Link
        href="/#waitlist"
        style={{
          display: "inline-block",
          background: "var(--ls-accent)",
          color: "#0D0D0D",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.05em",
          padding: "10px 20px",
          borderRadius: 6,
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
      >
        Join the waitlist →
      </Link>
    </div>
  );
}

export default function ArticleOne() {
  const [progress, setProgress] = useState(0);
  const [sectionName, setSectionName] = useState("Introduction");
  const articleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const total = el.scrollHeight - window.innerHeight;
      const pct = Math.max(
        0,
        Math.min(100, (-el.getBoundingClientRect().top / total) * 100),
      );
      setProgress(pct);
      const active = [...PROGRESS_SECTIONS]
        .reverse()
        .find((s) => pct >= s.threshold);
      if (active) setSectionName(active.name);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div className="ls-article" ref={articleRef}>
        <ProgressBar progress={progress} sectionName={sectionName} />

        <div style={{ maxWidth: 740, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <div className="ls-section-label">Signals — Practice</div>
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(26px, 5vw, 40px)",
                fontWeight: 600,
                lineHeight: 1.2,
                color: "var(--ls-text)",
                letterSpacing: "-0.02em",
                margin: "0 0 1.25rem",
              }}
            >
              {META.title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                fontSize: 13,
                color: "var(--ls-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span>{META.author}</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ls-accent)", display: "inline-block" }} />
              <time dateTime={META.publishedDate}>
                {new Date(META.publishedDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ls-accent)", display: "inline-block" }} />
              <span>{META.readingTime}</span>
            </div>
          </div>

          <AnswerBlock>
            Most AI features fail because of product decisions, not model quality.
            Teams start with the technology instead of a user problem, skip
            workflow integration, and measure model performance instead of user
            outcomes. MIT research found 95% of GenAI pilots produced zero
            measurable P&L impact — and the failure was almost never the model.
          </AnswerBlock>

          <p>
            In the last eighteen months, most product teams have done some version
            of the same thing. They paused roadmaps. They rewrote priorities. They
            added AI to products that didn&apos;t ask for it and removed features that
            were working to make room for ones that weren&apos;t ready.
          </p>

          <p>
            The question nobody stopped to ask — in the planning meeting, in the
            sprint, in the QBR where the numbers came back flat — was whether any
            of the product thinking had actually been done.
          </p>

          <PullQuote>
            That gap — between moving fast on AI and thinking clearly about AI — is
            where most AI features fail. Not in the model. In the decisions made
            before the model was ever called.
          </PullQuote>

          <h2>The data on AI feature failure is unambiguous</h2>
          <p>
            The numbers are not ambiguous. RAND research puts AI project failure
            rates above 80% - roughly double non-AI technology projects.
          </p>
          <StatGrid />

          <h2>How the product-layer collapse sequence works</h2>
          <p>
            These failures are baked in earlier, in a sequence of product decisions
            that seem reasonable in isolation and compound into the same outcome.
          </p>
          <CollapseFlow />

          <div className="ls-section-label">The 5 failure modes</div>
          {QUESTIONS.map((q) => (
            <QuestionBlock key={q.number} q={q} />
          ))}

          <Checklist />

          <div style={{ borderTop: "1px solid var(--ls-border)", paddingTop: "2rem" }}>
            <p style={{ fontSize: 16, color: "var(--ls-muted)", fontStyle: "italic", lineHeight: 1.8 }}>
              The collapse starts at problem definition. It surfaces at the QBR.
              And it gets misdiagnosed as a model problem every time, because the
              model is the most visible part of the system.
            </p>
          </div>

          <FAQBlock />
          <WaitlistCTA />
        </div>
      </div>
    </>
  );
}

