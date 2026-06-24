"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Article } from "@/lib/articles";

function truncateTitle(title: string): string {
  return title.length > 42 ? `${title.slice(0, 42)}...` : title;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 56,
        zIndex: 60,
        width: "100%",
        height: 2,
        background: "rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: "100%",
          background: "#C8F040",
          transition: "width 120ms linear",
        }}
      />
    </div>
  );
}

export default function ArticleShell({
  article,
  children,
}: {
  article: Article;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const node = contentRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const contentTop = window.scrollY + rect.top;
      const contentHeight = node.offsetHeight;
      const viewport = window.innerHeight;
      const maxScrollable = Math.max(1, contentHeight - viewport * 0.6);
      const amount = window.scrollY - contentTop + viewport * 0.25;
      const next = (amount / maxScrollable) * 100;
      setProgress(next);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <main style={{ background: "#0D0D0D", minHeight: "100vh" }}>
      <ProgressBar value={progress} />

      <div
        style={{
          padding: "10px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "rgba(255,255,255,0.25)",
        }}
      >
        <Link href="/signals" style={{ color: "rgba(255,255,255,0.25)" }}>
          Signals
        </Link>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{article.category}</span>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>
          {truncateTitle(article.title)}
        </span>
      </div>

      <article
        ref={contentRef}
        style={{
          maxWidth: 740,
          margin: "0 auto",
          padding: "40px 32px 80px",
        }}
      >
        {children}
      </article>
    </main>
  );
}

