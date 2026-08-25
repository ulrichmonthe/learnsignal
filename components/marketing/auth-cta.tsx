"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

// Auth-aware call-to-action for marketing surfaces.
//
// A client component rather than an auth() call in the page, so the marketing
// pages stay statically generated — reading auth server-side would make the
// highest-traffic, most SEO-sensitive surface dynamic for the sake of one link.
//
// Renders the signed-out CTA during SSR and before Clerk resolves (correct for
// crawlers, no-JS, and the large majority of visitors), then swaps once the
// session is known. The swap matters: pointing a signed-in user at /sign-up or
// /sign-in restarts authentication instead of continuing their session.

export function AuthCta({
  signedOutHref,
  signedOutLabel,
  signedInHref,
  signedInLabel,
  className,
  style,
}: {
  signedOutHref: string;
  signedOutLabel: string;
  signedInHref: string;
  signedInLabel: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded && isSignedIn;

  return (
    <Link
      href={signedIn ? signedInHref : signedOutHref}
      className={className}
      style={style}
    >
      {signedIn ? signedInLabel : signedOutLabel}
    </Link>
  );
}
