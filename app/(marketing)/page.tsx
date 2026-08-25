import Link from "next/link";
import { Nav } from "@/components/marketing/Nav";
import { AuthCta } from "@/components/marketing/auth-cta";
import { SlackDemo } from "@/components/marketing/slack-demo";

export default function Home() {
  return (
    <>
      <Nav />

      <div className="hero">
        <div className="hero-kicker">learnsignal.ai</div>
        <h1>
          AI PMs don&apos;t get better
          <br />
          from <em>watching.</em>
          <br />
          They get better from
          <br />
          <em>deciding.</em>
        </h1>
        <p className="hero-intro">
          LearnSignal is a training platform built entirely around one mechanic:{" "}
          <strong>
            put the PM inside the decision before revealing the answer.
          </strong>{" "}
          Every module is a real situation. Every lesson is earned through
          judgment, not absorbed through slides.
        </p>
      </div>

      <hr className="divider" />

      <div className="content">
        <div className="manifesto-section" id="about">
          <h2 className="section-heading">
            The knowledge gap is widening faster than anyone is closing it.
          </h2>

          <p className="lead">
            AI capabilities are compounding. The PM role has been rewritten. Yet
            most training built for AI PMs today is a patchwork — frameworks
            borrowed from general product management, lectures filmed before the
            current generation of models existed, and cohorts that move at the
            speed of a calendar rather than the speed of the field.
          </p>

          <div className="gap-block">
            <p>
              <strong>The PM in the meeting room knows how to ship.</strong> They
              do not know how to evaluate a model. They do not know when
              fine-tuning is the right call or a distraction. They are winging
              the conversations that shape what gets built.
            </p>
          </div>

          <p className="lead">
            This is not a personal failing. It is a structural one. The tools
            for developing this kind of judgment don&apos;t exist yet.{" "}
            <em>LearnSignal is being built to create them.</em>
          </p>
        </div>

        <div className="manifesto-section">
          <h2 className="section-heading">
            Judgment is built through decisions, not definitions.
          </h2>

          <div className="conviction">
            <span className="conviction-lead">
              The scenario comes before the framework.
            </span>
            <span className="conviction-body">
              Every module begins with a real situation — a hallucination
              reported the night before a board demo, a disagreement with an ML
              lead over fine-tuning vs RAG, an eval design with no ground truth.
              You inhabit the role first. You make the call. Then — and only then
              — does the technique reveal itself. That inversion is deliberate.
              That inversion is everything.
            </span>
          </div>

          <div className="conviction">
            <span className="conviction-lead">
              Pressure is part of the curriculum.
            </span>
            <span className="conviction-body">
              Competence built in calm doesn&apos;t transfer to chaos. LearnSignal
              scenarios are written to recreate the actual conditions of the job
              — stakeholder pressure, incomplete information, tight timelines.
              The discomfort is the point.
            </span>
          </div>

          <div className="conviction">
            <span className="conviction-lead">
              Comparison is how you calibrate.
            </span>
            <span className="conviction-body">
              After every decision, you see how your call compares to what
              experienced practitioners actually did — and why. Not to judge,
              but to build the internal reference point that separates a PM who
              guesses from a PM who knows.
            </span>
          </div>
        </div>

        <div className="manifesto-section">
          <p className="hero-kicker" style={{ marginBottom: 24 }}>See the mechanic</p>
          <h2 className="section-heading" style={{ marginBottom: 32 }}>
            You&apos;re in the room before the framework arrives.
          </h2>
          <SlackDemo />
        </div>

        <div className="manifesto-section">
          <h2 className="section-heading">What LearnSignal is not.</h2>

          <p className="lead">
            This is not a video course. Passive consumption builds familiarity,
            not fluency.
          </p>
          <p className="lead">
            It is not a cohort. Scheduling dependency is a tax on learning that
            professionals cannot afford to keep paying.
          </p>
          <p className="lead">
            It is not general product management education with an AI chapter
            bolted on. LearnSignal is{" "}
            <em>100% AI PM-specific.</em> Every scenario, every tool, every
            concept exists because an AI PM needs it — not because it rounds out
            a curriculum.
          </p>
          <p className="lead">
            It is not theoretical. The interactive tools embedded in the platform
            — prompt labs, cost calculators, eval builders — are the actual
            instruments of the job. You learn them by using them.
          </p>
        </div>

        <div className="manifesto-section">
          <h2 className="section-heading">How we&apos;re building it.</h2>

          <div className="conviction">
            <span className="conviction-lead">
              Scenarios first. Everything else follows.
            </span>
            <span className="conviction-body">
              The scenario engine is the platform. Before community features,
              before personalisation, before AI-generated content — we are
              writing the first 20 scenarios by hand, with practitioners, until
              they are genuinely hard to get right. The learning experience earns
              everything else.
            </span>
          </div>

          <div className="conviction">
            <span className="conviction-lead">
              Interactive tools embedded, not bolted on.
            </span>
            <span className="conviction-body">
              A Prompt Lab where you experiment with system prompts in the
              context of a real product decision. An Eval Builder that walks you
              through designing measurement frameworks for outputs that have no
              ground truth. A Cost Calculator that makes token economics
              tangible. These aren&apos;t resources linked in a sidebar — they
              are woven into the learning flow.
            </span>
          </div>

          <div className="conviction">
            <span className="conviction-lead">Signals, not noise.</span>
            <span className="conviction-body">
              The field moves too fast for a monthly digest. The Week&apos;s
              Signal surfaces one piece of research each week — stripped of
              academic framing, translated into the decisions it actually
              changes. We write for the PM who is too busy to read everything and
              too serious to accept a summary that doesn&apos;t tell them what to
              do differently.
            </span>
          </div>

          <div className="conviction">
            <span className="conviction-lead">
              Built in public, by a practitioner.
            </span>
            <span className="conviction-body">
              LearnSignal is being built by a practitioner, in the open —
              shipping the scenario engine first and letting the learning
              experience earn everything that comes after it.
            </span>
          </div>
        </div>

        <div className="join-section" id="start">
          <h2>
            Start building <em>judgment</em>.
          </h2>
          <p>
            LearnSignal is live. Create an account and step into your first
            decision — the technique reveals itself only after you&apos;ve made
            the call.
          </p>
          {/* Auth-aware: /sign-up for a signed-in user starts a fresh Clerk auth
              attempt, which ends their session and reads as being logged out. */}
          <AuthCta
            signedOutHref="/sign-up"
            signedOutLabel="Get started →"
            signedInHref="/dashboard"
            signedInLabel="Continue where you left off →"
            className="waitlist-btn"
            style={{ display: "inline-block", textDecoration: "none" }}
          />
        </div>
      </div>

      <footer>
        <Link className="footer-logo" href="/">
          Learn<span>Signal</span>
        </Link>
        <ul className="footer-links">
          <li>
            <Link href="/jobs">AI PM Jobs</Link>
          </li>
          <li>
            <Link href="/signals">Signals</Link>
          </li>
          <li>
            <AuthCta
              signedOutHref="/sign-in"
              signedOutLabel="Sign in"
              signedInHref="/dashboard"
              signedInLabel="Dashboard"
            />
          </li>
        </ul>
        <div className="footer-copy">© 2026</div>
      </footer>
    </>
  );
}
