"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const isSignals = pathname.startsWith("/signals");
  const isJobs = pathname.startsWith("/jobs");

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
      <Link href="/sign-in" className="nav-waitlist">Sign in →</Link>
    </nav>
  );
}

