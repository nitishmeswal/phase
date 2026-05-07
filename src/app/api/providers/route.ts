import { NextResponse } from "next/server";
import { listProviders } from "@/lib/llm";

export const runtime = "nodejs";
// Always re-evaluate so adding/removing keys via Vercel env vars takes effect
// on the next request (no need to redeploy just to flip a provider on).
export const dynamic = "force-dynamic";

/**
 * GET /api/providers
 *
 * Tells the client which LLM providers actually have API keys configured
 * on this deployment, plus the catalog of supported models per provider.
 * The model picker UI uses this to grey out unconfigured providers.
 */
export async function GET() {
  const providers = listProviders();
  const defaultProviderId =
    providers.find((p) => p.configured)?.id ?? providers[0].id;

  return NextResponse.json({ providers, defaultProviderId });
}
