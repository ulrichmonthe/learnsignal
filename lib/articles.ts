export type ArticleCategory = "Practice" | "Research" | "Tools" | "Industry";

export type Article = {
  slug: string;
  title: string;
  description: string;
  category: ArticleCategory;
  publishedAt: string;
  readingTime: string;
  author: string;
  tags: string[];
  primaryKeyword: string;
  answerBlock: string;
  seoTitle: string;
  ogImage: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "why-ai-features-fail-product-layer",
    title: "Why AI features fail at the product layer, not the model",
    description:
      "95% of GenAI pilots produce zero business impact. The failure is almost never the model - it is undefined success metrics, poor workflow integration, and PMs treating the LLM as the product.",
    category: "Practice",
    publishedAt: "2026-04-14",
    readingTime: "8 min read",
    author: "LearnSignal",
    tags: ["AI PM", "Product decisions", "Failure modes"],
    primaryKeyword: "AI features fail product layer",
    answerBlock:
      "Most AI features fail because of product decisions, not model quality. Teams start with the technology instead of a user problem, skip workflow integration, and measure model performance instead of user outcomes. MIT research found 95% of GenAI pilots produced zero measurable P&L impact - and the failure was almost never the model.",
    seoTitle: "Why AI features fail at the product layer, not the model",
    ogImage: "/og/why-ai-features-fail-product-layer.png",
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export default ARTICLES;
