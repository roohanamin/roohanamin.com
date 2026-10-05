"use client";
import { useActionState, useState } from "react";
import { sendCode, verifyCode } from "@/app/login/actions";
export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(sendCode, {});
  const [verification, verify, verifying] = useActionState(verifyCode, {});
  const [hasCode, setHasCode] = useState(false);
  return (
    <div>
      <form action={action} className="login-form">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
          disabled={pending || !configured}
        />
        <button className="primary" disabled={pending || !configured}>
          {pending
            ? "Sending your code…"
            : state.email
              ? "Send another code"
              : "Email me a sign-in code"}
          <span aria-hidden="true">↗</span>
        </button>
        {!configured && (
          <p className="notice">
            Sign-in is being connected. Please check back soon.
          </p>
        )}
        {state.error && (
          <p role="alert" className="error">
            {state.error}
          </p>
        )}
        {state.message && (
          <p role="status" className="success">
            {state.message}
          </p>
        )}
      </form>
      {state.email || hasCode ? (
        <form
          action={verify}
          className="login-form"
          key={state.email || "existing-code"}
        >
          {state.email ? (
            <>
              <input type="hidden" name="email" value={state.email} />
              <p className="fine-print">Code sent to {state.email}</p>
            </>
          ) : (
            <>
              <label htmlFor="code-email">Email address for your code</label>
              <input
                id="code-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </>
          )}
          <label htmlFor="token">Sign-in code</label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            minLength={6}
            maxLength={10}
            placeholder="Code from your email"
            required
            disabled={verifying}
          />
          <button className="primary" disabled={verifying}>
            {verifying ? "Signing in…" : "Sign in"}
            <span aria-hidden="true">↗</span>
          </button>
          {verification.error && (
            <p role="alert" className="error">
              {verification.error}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          className="text-button"
          onClick={() => setHasCode(true)}
          disabled={!configured}
        >
          I already have a code
        </button>
      )}
      <p className="fine-print">
        New here? Your first sign-in creates your account.
        <br />
        No password to remember.
      </p>
    </div>
  );
}
