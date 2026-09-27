"use client";

// Last resort when the root layout itself fails: no providers, no fonts.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F5F6F8", color: "#0B0D12" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div role="alert" style={{ maxWidth: 420, textAlign: "center", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 20, padding: 32 }}>
            <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Something went wrong</h1>
            <p style={{ color: "#475467", margin: "0 0 20px" }}>Please try again. / حدث خطأ، حاول مرة أخرى.</p>
            <button onClick={reset} style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#0B0D12", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              Try again
            </button>
            {error.digest && <p style={{ fontSize: 12, color: "#667085", marginTop: 16 }}>Ref: {error.digest}</p>}
          </div>
        </main>
      </body>
    </html>
  );
}
