import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { planByWhopPlanId } from "@/lib/billing/prediscore";
import { recordConversion } from "@/lib/data/affiliate";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 180_000;
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

// Webhook Whop → accorde/révoque le premium côté serveur.
// Sécurité : vérification de signature Standard Webhooks (HMAC-SHA256) avec
// WHOP_WEBHOOK_SECRET. L'utilisateur ne peut donc pas falsifier un paiement.

function verifySignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > WEBHOOK_TOLERANCE_SECONDS) return false;

  // Secret Standard Webhooks : "whsec_<base64>". Sinon on prend le secret brut.
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret, "utf8");

  const signedContent = `${id}.${ts}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");

  // Header : "v1,<sig> v1,<sig2>" → on compare à chaque signature fournie.
  const provided = sigHeader
    .split(" ")
    .map((p) => p.split(",")[1])
    .filter(Boolean);

  return provided.some((p) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(p), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

// Extraction défensive (le schéma exact du payload peut varier selon l'event).
function deepFind(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (typeof v === "string" && v) return v;
  }
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (v && typeof v === "object") {
      const found = deepFind(v, keys);
      if (found) return found;
    }
  }
  return undefined;
}

// Cherche n'importe quelle valeur string commençant par `prefix` (ex. "plan_")
// PARTOUT dans le payload, même imbriquée (Whop peut envoyer le plan sous forme
// d'objet `plan: { id: "plan_..." }` selon l'event). Plus fiable que par clé.
function findByPrefix(
  obj: unknown,
  prefix: string,
  seen = new Set<unknown>(),
): string | undefined {
  if (!obj || typeof obj !== "object" || seen.has(obj)) return undefined;
  seen.add(obj);
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (typeof v === "string" && v.startsWith(prefix)) return v;
  }
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (v && typeof v === "object") {
      const found = findByPrefix(v, prefix, seen);
      if (found) return found;
    }
  }
  return undefined;
}

export async function POST(req: Request) {
  const limited = rateLimit(`whop:${getClientIp(req)}`, { limit: 120, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).length > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  if (!verifySignature(rawBody, req.headers)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const action = String(
    payload.action ?? payload.type ?? payload.event ?? "",
  ).toLowerCase();
  const data = (payload.data ?? payload) as Record<string, unknown>;

  const email = deepFind(data, ["email", "user_email", "customer_email"]);
  // 1) on prend en priorité un vrai id de plan (`plan_…`) où qu'il soit dans le
  // payload ; 2) sinon on retombe sur une recherche par clé.
  const whopPlanId =
    findByPrefix(data, "plan_") ??
    deepFind(data, ["plan_id", "plan", "access_pass_id", "product_id"]);
  const membershipId = deepFind(data, ["membership_id", "id"]);

  const isActivate =
    action.includes("payment.succeeded") ||
    action.includes("membership.activated") ||
    action.includes("went_valid");
  const isDeactivate =
    action.includes("membership.deactivated") ||
    action.includes("went_invalid") ||
    action.includes("canceled") ||
    action.includes("cancelled");

  const status = isActivate ? "active" : isDeactivate ? "canceled" : null;

  // Event non pertinent → 200 (pas de retry inutile).
  if (!status) return NextResponse.json({ ok: true });

  if (!email) {
    console.error(
      "[prediscore][whop] webhook sans email — payload:",
      JSON.stringify(payload).slice(0, 800),
    );
    return NextResponse.json({ ok: true });
  }

  const plan = whopPlanId ? planByWhopPlanId(whopPlanId) : undefined;

  // Plan non reconnu → on logge l'id Whop reçu + un extrait du payload. En mode
  // lancement on n'accorde aucun accès sans mapping explicite.
  if (status === "active" && !plan) {
    console.error(
      "[PrediScore][whop] plan NON mappé → accès refusé, whopPlanId reçu:",
      whopPlanId ?? "(aucun)",
      "| payload:",
      JSON.stringify(payload).slice(0, 1000),
    );
    return NextResponse.json({ ok: true, ignored: "unmapped_plan" });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("payments").upsert(
    {
      email: email.toLowerCase(),
      plan_id: status === "active" ? plan!.id : null,
      status,
      whop_membership_id: membershipId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[PrediScore][whop] upsert payments:", error.message);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  // Affiliation : au 1er paiement, crédite le parrain (idempotent, non bloquant).
  if (status === "active" && plan) {
    void recordConversion({ email: email.toLowerCase(), planId: plan.id, amount: plan.price }).catch(
      (e) => console.error("[PrediScore][aff] conversion:", e),
    );
  }

  return NextResponse.json({ ok: true });
}
