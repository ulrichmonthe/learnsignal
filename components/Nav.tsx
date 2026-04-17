"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WaitlistLink } from "@/components/WaitlistLink";

export function Nav() {
  const pathname = usePathname();
  const isSignals = pathname.startsWith("/signals");

  return (
    <nav>
      <Link className="nav-logo" href="/">
        Learn<span>Signal</span>
      </Link>
      <ul className="nav-links">
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
      <WaitlistLink className="nav-waitlist">Join the waitlist →</WaitlistLink>
    </nav>
  );
}

