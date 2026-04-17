"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Article, ArticleCategory } from "@/lib/articles";

const FILTERS: Array<"All" | ArticleCategory> = [
  "All",
  "Practice",
  "Research",
  "Tools",
  "Industry",
];

function formatDate(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function filterArticles(
  articles: Article[],
  active: "All" | ArticleCategory,
): Article[] {
  if (active === "All") return articles;
  return articles.filter((article) => article.category === active);
}

export default function SignalsFilterBar({ articles }: { articles: Article[] }) {
  const [active, setActive] = useState<"All" | ArticleCategory>("All");

  const visible = useMemo(
    () => filterArticles(articles, active),
    [articles, active],
  );

  return (
    <section style={{ padding: "20px 32px 60px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 28,
        }}
      >
        {FILTERS.map((filter) => {
          const isActive = active === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActive(filter)}
              style={{
                padding: "8px 12px",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderRadius: 3,
                border: isActive
                  ? "1px solid #C8F040"
                  : "1px solid rgba(255,255,255,0.12)",
                background: isActive ? "#C8F040" : "transparent",
                color: isActive ? "#0D0D0D" : "rgba(255,255,255,0.4)",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <div>
        {visible.map((article) => (
          <article
            key={article.slug}
            style={{
              padding: "24px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#C8F040",
                  background: "rgba(200,240,64,0.1)",
                  padding: "4px 8px",
                  borderRadius: 3,
                }}
              >
                {article.category}
              </span>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                }}
              />
              <span>{formatDate(article.publishedAt)}</span>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                }}
              />
              <span>{article.readingTime}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <Link
                href={`/signals/${article.slug}`}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 19,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "#F0EFE8",
                  textDecoration: "none",
                }}
              >
                {article.title}
              </Link>
              <span style={{ color: "#C8F040", fontSize: 20 }}>→</span>
            </div>

            <p
              style={{
                marginTop: 10,
                marginBottom: 14,
                maxWidth: 600,
                fontSize: 14,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.45)",
              }}
            >
              {article.description}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "3px 8px",
                    borderRadius: 3,
                    letterSpacing: "0.04em",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

