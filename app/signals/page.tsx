import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { WaitlistLink } from "@/components/WaitlistLink";
import ARTICLES from "@/lib/articles";
import SignalsFilterBar from "@/components/signals/SignalsFilterBar";

export const metadata: Metadata = {
  title: "Signals - LearnSignal",
  description:
    "Research and hard truths for AI product managers building on AI. No frameworks. No hype. Just decisions.",
};

export default function SignalsPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "#0D0D0D", minHeight: "100vh" }}>
        <header
          style={{
            padding: "48px 32px 32px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#C8F040",
              marginBottom: 18,
            }}
          >
            Signals by LearnSignal
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: 32,
              lineHeight: 1.2,
              color: "#F0EFE8",
              letterSpacing: "-0.02em",
              maxWidth: 800,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            For the AI PM in the room who actually understands the constraints
          </h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: 15,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 520,
              margin: 0,
            }}
          >
            Research, practice, tools, and hard truths for product managers
            building on AI. No frameworks. No hype. Just decisions.
          </p>
        </header>

        <SignalsFilterBar articles={ARTICLES} />
      </main>

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
