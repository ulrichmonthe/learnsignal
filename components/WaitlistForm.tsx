"use client";

import { FormEvent, useState } from "react";

type Status =
  | { kind: "idle"; message: string }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>({
    kind: "idle",
    message: "No spam. Launch notes only.",
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim();
    const normalizedCompany = company.trim();

    if (!normalizedEmail || !normalizedRole || !normalizedCompany) {
      setStatus({
        kind: "error",
        message: "Please enter your email, role, and company.",
      });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setStatus({
        kind: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setStatus({ kind: "loading", message: "Joining..." });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          role: normalizedRole,
          company: normalizedCompany,
        }),
      });

      if (response.status === 200) {
        setEmail("");
        setRole("");
        setCompany("");
        setStatus({
          kind: "success",
          message: "You're on the list. We'll be in touch.",
        });
        return;
      }

      if (response.status === 409) {
        setStatus({
          kind: "error",
          message: "You're already on the list.",
        });
        return;
      }

      if (response.status === 400) {
        setStatus({
          kind: "error",
          message: "Please enter a valid email address.",
        });
        return;
      }

      setStatus({
        kind: "error",
        message: "Something went wrong. Try again.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Something went wrong. Try again.",
      });
    }
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit}>
      <div className="waitlist-grid">
        <input
          className="waitlist-input"
          type="email"
          name="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === "loading"}
          aria-label="Email"
        />
        <input
          className="waitlist-input"
          type="text"
          name="role"
          placeholder="Your role"
          autoComplete="organization-title"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={status.kind === "loading"}
          aria-label="Role"
        />
        <input
          className="waitlist-input"
          type="text"
          name="company"
          placeholder="Company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={status.kind === "loading"}
          aria-label="Company"
        />
      </div>
      <div className="waitlist-row">
        <button
          className="waitlist-btn"
          type="submit"
          disabled={status.kind === "loading"}
        >
          {status.kind === "loading" ? "Joining..." : "Join the waitlist"}
        </button>
      </div>
      <p
        className={`join-note ${
          status.kind === "success"
            ? "join-note-success"
            : status.kind === "error"
              ? "join-note-error"
              : ""
        }`}
        aria-live="polite"
      >
        {status.message}
      </p>
    </form>
  );
}

