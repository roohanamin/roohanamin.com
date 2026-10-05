"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <h1>Let’s try that again.</h1>
      <p>
        Something interrupted the connection. Your saved entries are still in
        your account.
      </p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
      <a href="/login">Back to sign-in</a>
    </main>
  );
}
