import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingPlanId } from "@/types";

// Lecture de l'entitlement premium (table payments, écrite par le webhook Whop).
// La RLS limite déjà la ligne à l'email du JWT — c'est la vérité serveur.

export interface Entitlement {
  active: boolean;
  planId: BillingPlanId | null;
}

const VALID_PLANS = new Set<BillingPlanId>(["essentiel", "pro", "lifetime"]);

export async function loadEntitlement(
  client: SupabaseClient,
  email: string | null | undefined,
): Promise<Entitlement> {
  if (!email) return { active: false, planId: null };
  const { data, error } = await client
    .from("payments")
    .select("plan_id, status, tier")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error || !data) return { active: false, planId: null };
  const planFromWhop = data.status === "active" && VALID_PLANS.has(data.plan_id as BillingPlanId)
    ? (data.plan_id as BillingPlanId)
    : null;
  const planFromAdmin = data.tier && data.tier !== "gratuit" && VALID_PLANS.has(data.tier as BillingPlanId)
    ? (data.tier as BillingPlanId)
    : null;
  const planId = planFromWhop ?? planFromAdmin;
  return {
    active: Boolean(planId),
    planId,
  };
}
