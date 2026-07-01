import { NextResponse } from "next/server";
import { recordClick } from "@/lib/data/affiliate";
import { sanitizeCode } from "@/lib/affiliate/config";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

// Log d'un clic sur un lien d'affiliation (?ref=CODE). Appelé par <RefTracker/>.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`aff-click:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = sanitizeCode(String(body?.code ?? ""));
  } catch {
    return NextResponse.json({ ok: false });
  }
  if (!code) return NextResponse.json({ ok: false });

  const ua = req.headers.get("user-agent");
  await recordClick(code, ip, ua).catch(() => {});
  return NextResponse.json({ ok: true });
}
