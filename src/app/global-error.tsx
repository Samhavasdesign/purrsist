"use client";

import { useEffect } from "react";

// Replaces the root layout when the root layout itself throws, so it must ship
// its own <html>/<body> and cannot rely on globals.css or the font variables.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          background: "#faf9f6",
          color: "#2a2530",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: "32ch", color: "#696370" }}>
          The app failed to load. This is usually temporary — try again.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            font: "inherit",
            padding: "0.625rem 1.25rem",
            borderRadius: "999px",
            border: "none",
            background: "#5b63a6",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest ? (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#696370" }}>
            Reference: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
