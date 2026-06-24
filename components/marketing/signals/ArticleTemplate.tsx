"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── HOW TO USE THIS TEMPLATE ────────────────────────────────────────
// 1. Copy this file to components/signals/Article[N].tsx
// 2. Search for all TODO comments and replace with real content
// 3. Create app/signals/[your-slug]/page.tsx using Step 4 of
//    CURSOR_INSTRUCTIONS.md as the guide
// 4. Add the article metadata to lib/articles.ts
// 5. Test locally, then deploy
// ─────────────────────────────────────────────────────────────────────

const META = {
  // TODO: replace with article metadata values
  slug: "TODO-slug",
  title: "TODO title",
  description: "TODO short description",
  category: "Practice",
  publishedAt: "2026-01-01",
  readingTime: "8 min read",
  author: "LearnSignal",
};

const TODO_FAQS = [
  { q: "TODO question 1", a: "TODO answer 1" },
  { q: "TODO question 2", a: "TODO answer 2" },
  { q: "TODO question 3", a: "TODO answer 3" },
  { q: "TODO question 4", a: "TODO answer 4" },
  { q: "TODO question 5", a: "TODO answer 5" },
];

export default function ArticleTemplate() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false, false]);
  const [progress, setProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const node = articleRef.current;
      if (!node) return;
      const top = window.scrollY + node.getBoundingClientRect().top;
      const height = node.offsetHeight;
      const amount = window.scrollY - top + window.innerHeight * 0.25;
      setProgress((amount / Math.max(1, height - window.innerHeight * 0.6)) * 100);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const checkedCount = checks.filter(Boolean).length;

  return (
    <div ref={articleRef}>
      <div
        style={{
          position: "sticky",
          top: 56,
          height: 2,
          background: "rgba(255,255,255,0.08)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            height: "100%",
            background: "#C8F040",
          }}
        />
      </div>

      <h1>{META.title}</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Answer block</h2>
        <p>
          {/* TODO: 40-60 word direct answer block */}
          TODO answer block text.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Stat cards</h2>
        {/* TODO: Replace with final stat cards */}
        <div style={{ display: "grid", gap: 10 }}>
          <div>TODO stat 1</div>
          <div>TODO stat 2</div>
          <div>TODO stat 3</div>
        </div>
      </section>

      <blockquote style={{ marginBottom: 24 }}>
        {/* TODO: Pull quote */}
        TODO pull quote
      </blockquote>

      {[1, 2, 3, 4].map((n) => (
        <section key={n} style={{ marginBottom: 22 }}>
          <h2>{`TODO section heading ${n}`}</h2>
          <p style={{ color: "#C8F040", fontStyle: "italic" }}>
            {/* TODO: Direct answer sentence */}
            TODO direct answer
          </p>
          <p>{/* TODO: Body paragraph */} TODO body paragraph</p>
          <button
            type="button"
            onClick={() => setExpanded(expanded === n ? null : n)}
          >
            {expanded === n ? "Collapse details" : "Expand details"}
          </button>
          {expanded === n && <p>{/* TODO: Expanded content */} TODO expanded content</p>}
        </section>
      ))}

      <section style={{ marginBottom: 24 }}>
        <h2>Interactive checklist</h2>
        {[0, 1, 2, 3, 4].map((idx) => (
          <label key={idx} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={checks[idx]}
              onChange={(e) =>
                setChecks((current) =>
                  current.map((v, i) => (i === idx ? e.target.checked : v)),
                )
              }
            />
            {/* TODO: checklist item text */}
            {` TODO checklist item ${idx + 1}`}
          </label>
        ))}
        {checkedCount >= 2 && <p>TODO warning message when 2+ are checked</p>}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>FAQ</h2>
        {TODO_FAQS.map((faq) => (
          <div key={faq.q}>
            <h3>{faq.q}</h3>
            <p>{faq.a}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Waitlist CTA</h2>
        <p>TODO waitlist CTA copy.</p>
        <Link href="/#waitlist">Join the waitlist</Link>
      </section>
    </div>
  );
}

