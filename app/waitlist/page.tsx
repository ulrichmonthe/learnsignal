"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WaitlistRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
    const t = window.setTimeout(() => {
      document
        .getElementById("waitlist")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B0B09",
        color: "#888882",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
      }}
    >
      Taking you to the waitlist…
    </div>
  );
}
