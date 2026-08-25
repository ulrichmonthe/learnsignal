"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";

export function Nav() {
  const pathname = usePathname();
  const isSignals = pathname.startsWith("/signals");
  const isJobs = pathname.startsWith("/jobs");
  const isWeekly = pathname.startsWith("/weekly-signal");
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav>
      <Link className="nav-logo" href="/">
        Learn<span>Signal</span>
      </Link>
      <ul className="nav-links">
        <li>
          <Link
            href="/jobs"
            style={isJobs ? { color: "#F0EFE8", fontWeight: 500 } : undefined}
          >
            Jobs
          </Link>
        </li>
        <li>
          <Link
            href="/weekly-signal"
            style={isWeekly ? { color: "#F0EFE8", fontWeight: 500 } : undefined}
          >
            Weekly Signal
          </Link>
        </li>
        <li>
          <Link
            href="/signals"
            style={isSignals ? { color: "#F0EFE8", fontWeight: 500 } : undefined}
          >
            Signals
          </Link>
        </li>
        <li>
          <Link href="/#about">About</Link>
        </li>
      </ul>

      {/* Auth-aware. Showing "Sign in" to an already-signed-in user isn't just
          untidy: following it starts a fresh Clerk sign-in attempt, which tears
          down the active session — it reads to the user as being logged out. */}
      {/* Held back until Clerk resolves: rendering "Sign in" first and swapping
          would flash the exact affordance that causes the bug. */}
      {!isLoaded ? (
        <span aria-hidden="true" />
      ) : isSignedIn ? (
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/dashboard" className="nav-waitlist">
            Dashboard →
          </Link>
          <UserButton />
        </span>
      ) : (
        <Link href="/sign-in" className="nav-waitlist">
          Sign in →
        </Link>
      )}
    </nav>
  );
}
