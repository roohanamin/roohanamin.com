import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && isConfigured()) {
    const client = await createClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
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
