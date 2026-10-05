"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { entrySchema, toKg, type Result } from "@/lib/weight";
import { z } from "zod";
export async function saveEntry(form: FormData): Promise<Result> {
  const parsed = entrySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const client = await createClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user)
    return { error: "Your session expired. Sign in again before saving." };
  const { id, weight, unit, measured_on, note } = parsed.data;
  // Stable client-generated IDs make retrying a failed connection safe.
  const { error } = await client
    .from("weight_entries")
    .upsert(
      {
        id,
        user_id: user.id,
        weight_kg: toKg(weight, unit),
        unit,
        measured_on,
        note,
      },
      { onConflict: "id" },
    );
  if (error)
    return {
      error: "Could not save your entry. Check your connection and try again.",
    };
  revalidatePath("/weight");
  return { message: "Entry saved." };
}
export async function deleteEntry(id: string): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success)
    return { error: "Invalid entry." };
  const client = await createClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user)
    return { error: "Your session expired. Sign in again." };
  const { data, error } = await client
    .from("weight_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data?.length)
    return { error: "Could not delete this entry. Refresh and try again." };
  revalidatePath("/weight");
  return { message: "Entry deleted." };
}
