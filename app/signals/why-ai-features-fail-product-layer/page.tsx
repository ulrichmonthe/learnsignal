import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { WaitlistLink } from "@/components/WaitlistLink";
import ArticleShell from "@/components/signals/ArticleShell";
import ArticleOne from "@/components/signals/ArticleOne";
import { getArticleBySlug } from "@/lib/articles";

const SLUG = "why-ai-features-fail-product-layer";

export async function generateMetadata(): Promise<Metadata> {
  const article = getArticleBySlug(SLUG);
  if (!article) return {};

  return {
    title: article.seoTitle,
    description: article.description,
    alternates: {
      canonical: `https://learnsignal.ai/signals/${article.slug}`,
    },
    openGraph: {
      title: article.seoTitle,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      siteName: "Signals by LearnSignal",
      images: [{ url: article.ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.description,
    },
  };
}

export default async function ArticleOnePage() {
  const article = getArticleBySlug(SLUG);
  if (!article) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "LearnSignal" },
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Why do most AI features fail in production?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most AI features fail because of product decisions, not model quality. Teams start with the technology instead of a user problem, skip workflow integration, and measure model performance instead of user outcomes. MIT research found 95% of GenAI pilots produced zero measurable P&L impact.",
        },
      },
      {
        "@type": "Question",
        name: "What is the product layer failure in AI development?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The product layer failure occurs when an AI feature fails due to poor product decisions - undefined success metrics, features that do not integrate into user workflows, bad training data governance, or no trust design - rather than technical model limitations.",
        },
      },
      {
        "@type": "Question",
        name: "How do I know if my AI feature has a product problem or a model problem?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ask five questions: Did you start with the problem or the model? Do you know who labelled your training data? Does the feature live inside the user workflow? Can users tell when the AI is wrong? Are you measuring user outcomes or model metrics? Two or more no answers indicate a product problem.",
        },
      },
      {
        "@type": "Question",
        name: "When should I upgrade my AI model versus fix the product?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Upgrade the model only after ruling out product-layer failures. If you have not defined user outcome metrics, integrated the feature into the workflow, or designed for AI errors, a better model will not fix the problem.",
        },
      },
      {
        "@type": "Question",
        name: "What does workflow integration mean for AI product managers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Workflow integration means the AI feature is built inside the tool users already have open, triggered by actions they are already taking, and returns results in the context where they are needed - not as a separate tool users must visit.",
        },
      },
    ],
  };

  return (
    <>
      <Nav />
      <ArticleShell article={article}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <ArticleOne />
      </ArticleShell>
      <footer>
        <Link className="footer-logo" href="/">
          Learn<span>Signal</span>
        </Link>
        <ul className="footer-links">
          <li>
            <Link href="/signals">Signals</Link>
          </li>
          <li>
            <WaitlistLink>Waitlist</WaitlistLink>
          </li>
        </ul>
        <div className="footer-copy">© 2026</div>
      </footer>
    </>
  );
}

