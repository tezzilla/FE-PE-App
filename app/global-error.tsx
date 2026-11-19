"use client";

// Last-resort page when the root layout itself fails. It replaces the whole document, so it carries its own styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a", margin: 0 }}>
        <div style={{ maxWidth: 420, margin: "15vh auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24 }}>CivilPrep is having trouble</h1>
          <p style={{ color: "#475569" }}>Please try again in a moment. Your progress is saved.</p>
          <button onClick={reset} style={{ background: "#c2410c", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
          {error.digest && <p style={{ color: "#64748b", fontSize: 12, marginTop: 16 }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
