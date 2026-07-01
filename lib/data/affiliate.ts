import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_COMMISSION_RATE, sanitizeCode } from "@/lib/affiliate/config";

export interface AffiliateStat {
  code: string;
  name: string | null;
  payout_email: string | null;
  commission_rate: number;
  active: boolean;
  clicks: number;
  signups: number;
  paying: number;
  revenue: number;
  commission_total: number;
  stats_token: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AffiliateRow {
  code: string;
  commission_rate: number;
  active: boolean;
}

export async function getAffiliateByCode(code: string): Promise<AffiliateRow | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const admin = createSupabaseAdminClient();
  // Insensible à la casse : un code saisi « Raphael » dans Supabase reste trouvé
  // même si le lien arrive en « raphael » (les codes sont uniques et URL-safe).
  const { data } = await admin
    .from("affiliates")
    .select("code, commission_rate, active")
    .ilike("code", trimmed)
    .maybeSingle();
  return (data as AffiliateRow | null) ?? null;
}

// Log d'un clic sur un lien d'affiliation (code valide + actif uniquement).
export async function recordClick(code: string, ip?: string | null, userAgent?: string | null) {
  const aff = await getAffiliateByCode(code);
  if (!aff?.active) return;
  const admin = createSupabaseAdminClient();
  await admin.from("affiliate_clicks").insert({
    code: aff.code,
    ip: ip ?? null,
    user_agent: userAgent ? userAgent.slice(0, 300) : null,
  });
}

// Enregistre le parrainage email ← code (idempotent : ne remplace pas un
// parrainage antérieur).
export async function ensureReferral(email: string, code: string) {
  const aff = await getAffiliateByCode(code);
  if (!aff?.active) return;
  const admin = createSupabaseAdminClient();
  await admin
    .from("affiliate_referrals")
    .upsert({ email: email.toLowerCase(), code: aff.code }, { onConflict: "email", ignoreDuplicates: true });
}

export async function getReferralCode(email: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("affiliate_referrals")
    .select("code")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return (data?.code as string | undefined) ?? null;
}

// Conversion au 1er paiement : commission = montant × taux du parrain.
// Idempotent (1 conversion par email) → seul le 1er paiement compte.
export async function recordConversion(params: { email: string; planId: string; amount: number }) {
  const email = params.email.toLowerCase();
  const code = await getReferralCode(email);
  if (!code) return;
  const aff = await getAffiliateByCode(code);
  if (!aff) return;
  const rate = Number(aff.commission_rate ?? DEFAULT_COMMISSION_RATE);
  const commission = Math.round(params.amount * rate * 100) / 100;
  const admin = createSupabaseAdminClient();
  await admin.from("affiliate_conversions").upsert(
    { email, code: aff.code, plan_id: params.planId, amount: params.amount, commission },
    { onConflict: "email", ignoreDuplicates: true },
  );
}

// --- Admin -----------------------------------------------------------------

// Stats d'UN affilié via son jeton secret (page publique /partenaire/<token>).
// Le jeton est un UUID non devinable → l'influenceur voit ses chiffres sans
// aucun accès à Supabase, et ne peut pas voir ceux des autres.
export async function getAffiliateStatByToken(token: string): Promise<AffiliateStat | null> {
  const clean = token.trim();
  if (!UUID_RE.test(clean)) return null;
  const admin = createSupabaseAdminClient();
  const { data: aff } = await admin
    .from("affiliates")
    .select("code")
    .eq("stats_token", clean)
    .maybeSingle();
  const code = (aff as { code: string } | null)?.code;
  if (!code) return null;
  const { data } = await admin
    .from("affiliate_stats")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return (data as AffiliateStat | null) ?? null;
}

export async function listAffiliateStats(): Promise<AffiliateStat[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("affiliate_stats")
    .select("*")
    .order("commission_total", { ascending: false });
  return (data as AffiliateStat[] | null) ?? [];
}

export async function createAffiliate(input: {
  code: string;
  name?: string;
  payoutEmail?: string;
  rate?: number;
}): Promise<{ ok: boolean; code?: string; error?: string }> {
  const code = sanitizeCode(input.code);
  if (!code) return { ok: false, error: "Code invalide (lettres/chiffres/-/_)." };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("affiliates").insert({
    code,
    name: input.name?.trim() || null,
    payout_email: input.payoutEmail?.trim() || null,
    commission_rate:
      typeof input.rate === "number" && input.rate > 0 && input.rate <= 1
        ? input.rate
        : DEFAULT_COMMISSION_RATE,
  });
  if (error) {
    return { ok: false, error: error.code === "23505" ? "Ce code existe déjà." : error.message };
  }
  return { ok: true, code };
}
