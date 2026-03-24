import { NextResponse } from "next/server";

// Temporary debug route — remove after confirming env vars work in Portainer.
// Access via: http://subg:7000/api/debug-env
export async function GET() {
  const keys = [
    "NEXT_PUBLIC_AUTH_API",
    "NEXT_PUBLIC_METAS_API",
    "NEXT_PUBLIC_SUPPORT_API",
    "NEXT_PUBLIC_SYSTEMS_API",
    "NEXT_PUBLIC_SYSTEM_ID",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "NEXT_PUBLIC_DISCORD_CATEGORY_ID",
  ];

  const env: Record<string, string | undefined> = {};
  for (const key of keys) {
    const val = process.env[key];
    // Show only first 30 chars to avoid leaking full secrets
    env[key] = val ? val.slice(0, 30) + (val.length > 30 ? "..." : "") : "(NOT SET)";
  }

  return NextResponse.json({ env, timestamp: new Date().toISOString() });
}
