"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function WaitlistLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href="/#waitlist"
      className={className}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          document
            .querySelector(".join-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }
      }}
    >
      {children}
    </Link>
  );
}
