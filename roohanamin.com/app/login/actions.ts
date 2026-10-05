"use server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Result } from "@/lib/weight";
export type SignInResult = Result & { email?: string };
export async function sendCode(
  _previous: SignInResult,
  form: FormData,
): Promise<SignInResult> {
  if (!isConfigured())
    return { error: "Sign-in is being connected. Please try again soon." };
  const email = z.string().trim().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const client = await createClient();
  // A configured canonical origin prevents host-header-controlled redirects.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await client.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error)
    return { error: "We couldn’t send the code. Wait a minute and try again." };
  return {
    email: email.data,
    message:
      "Check your email, then enter the sign-in code here. It works for new accounts too.",
  };
}
export async function verifyCode(
  _previous: Result,
  form: FormData,
): Promise<Result> {
  if (!isConfigured())
    return { error: "Sign-in is being connected. Please try again soon." };
  const input = z
    .object({
      email: z.string().trim().email(),
      token: z
        .string()
        .trim()
        .regex(/^\d{6,10}$/),
    })
    .safeParse({ email: form.get("email"), token: form.get("token") });
  if (!input.success)
    return { error: "Enter your email address and the code from your email." };
  const client = await createClient();
  const { error } = await client.auth.verifyOtp({
    ...input.data,
    type: "email",
  });
  if (error)
    return {
      error: "That code is invalid or expired. Check it or request a new code.",
    };
  redirect("/weight");
}
export async function signOut(): Promise<Result> {
  const client = await createClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error)
    return { error: "Could not sign out. Please reconnect and try again." };
  redirect("/login");
}
