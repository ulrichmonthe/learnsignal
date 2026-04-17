"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 40,
        background: "#0B0B09",
        color: "#EDEAE1",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
      <p style={{ color: "#888882", marginBottom: 24 }}>
        {error.message || "Please refresh the page or try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          background: "#C8F040",
          color: "#0B0B09",
          border: "none",
          padding: "12px 20px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
