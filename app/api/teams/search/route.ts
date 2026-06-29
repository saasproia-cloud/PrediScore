import { NextResponse } from "next/server";
import { searchTeams } from "@/lib/football/provider";
import { cached } from "@/lib/security/api-cache";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { trimParam } from "@/lib/security/request";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`teams:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  const q = trimParam(new URL(req.url).searchParams.get("q"), 60) ?? "";
  if (q.length < 2) {
    return withRateLimitHeaders(NextResponse.json({ teams: [] }), limited);
  }

  const cacheKey = `teams:${q.toLowerCase()}`;
  const teams = await cached(cacheKey, 5 * 60_000, () => searchTeams(q));
  return withRateLimitHeaders(NextResponse.json({ teams }), limited);
}
