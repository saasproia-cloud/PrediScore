import { NextResponse } from "next/server";
import { searchFixturesForTeams } from "@/lib/football/provider";
import { cached } from "@/lib/security/api-cache";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { trimParam } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`fixtures:${ip}`, { limit: 40, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  const params = new URL(req.url).searchParams;
  const team = trimParam(params.get("team"), 80);
  const home = trimParam(params.get("home"), 80);
  const away = trimParam(params.get("away"), 80);

  if (!team && !home && !away) {
    return withRateLimitHeaders(
      NextResponse.json(
        { error: "Choisis au moins une équipe.", fixtures: [], mode: "team-upcoming", source: "demo" },
        { status: 400 },
      ),
      limited,
    );
  }

  const cacheKey = `fixtures:${team ?? ""}:${home ?? ""}:${away ?? ""}`.toLowerCase();
  const result = await cached(cacheKey, 2 * 60_000, () =>
    searchFixturesForTeams({ team, home, away }),
  );
  return withRateLimitHeaders(NextResponse.json(result), limited);
}
