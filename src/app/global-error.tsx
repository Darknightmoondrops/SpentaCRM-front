"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="global-error-page">
          <div className="eyebrow">SYSTEM / RECOVERY ──</div>
          <h1>CRM shell could not start.</h1>
          <p>A global recovery boundary is present for failures above individual workspace routes.</p>
          <button className="primary-button" type="button" onClick={reset}>Reload workspace</button>
        </main>
      </body>
    </html>
  );
}
