"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console and Vercel's client logs; the digest
    // below matches the server-side log line for this render.
    console.error("App route error:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        color: "var(--foreground)",
      }}
    >
      <h1 style={{ margin: 0, font: "var(--text-title)" }}>
        Something went wrong
      </h1>
      <p style={{ margin: 0, maxWidth: "32ch", color: "var(--muted)" }}>
        That page didn&rsquo;t load. This is usually temporary — try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        style={{
          font: "var(--text-label)",
          padding: "0.625rem 1.25rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: "var(--accent)",
          color: "var(--accent-foreground)",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
      {error.digest ? (
        <p style={{ margin: 0, font: "var(--text-eyebrow)", color: "var(--muted)" }}>
          Reference: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
