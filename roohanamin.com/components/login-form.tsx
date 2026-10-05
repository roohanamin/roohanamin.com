"use client";
import { useActionState } from "react";
import { sendLink } from "@/app/login/actions";
export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(sendLink, {});
  return (
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
        {pending ? "Sending your link…" : "Email me a sign-in link"}
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
      <p className="fine-print">
        New here? Your first sign-in creates your account.
        <br />
        No password to remember.
      </p>
    </form>
  );
}
