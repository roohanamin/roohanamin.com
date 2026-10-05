import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
import { WeightLog } from "@/components/weight-log";
import type { Entry } from "@/lib/weight";
export const dynamic = "force-dynamic";
export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!isConfigured()) redirect("/login");
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(params.page) || 1)),
  );
  const { data, count, error } = await client
    .from("weight_entries")
    .select("id,weight_kg,unit,measured_on,note,created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);
  return (
    <WeightLog
      entries={(data || []) as Entry[]}
      count={count || 0}
      page={page}
      email={user.email || ""}
      loadError={Boolean(error)}
    />
  );
}
