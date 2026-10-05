import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
// Token-hash email links also work when opened from a different browser/device.
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (token_hash && (type === "email" || type === "signup") && isConfigured()) {
    const client = await createClient();
    const { error } = await client.auth.verifyOtp({ token_hash, type });
    if (!error)
      return NextResponse.redirect(
        new URL("/weight", process.env.NEXT_PUBLIC_SITE_URL || request.url),
        {
          headers: { "Cache-Control": "private, no-store" },
        },
      );
  }
  return NextResponse.redirect(
    new URL(
      "/login?expired=1",
      process.env.NEXT_PUBLIC_SITE_URL || request.url,
    ),
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
