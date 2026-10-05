"use server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Result } from "@/lib/weight";
export async function sendLink(
  _previous: Result,
  form: FormData,
): Promise<Result> {
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
    return { error: "We couldn’t send the link. Wait a minute and try again." };
  return {
    message:
      "Check your inbox for your sign-in link. Open it on this device. It works for new accounts too.",
  };
}
export async function signOut(): Promise<Result> {
  const client = await createClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error)
    return { error: "Could not sign out. Please reconnect and try again." };
  redirect("/login");
}
