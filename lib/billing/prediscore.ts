// Offres PrediScore — source de vérité unique (pricing, paywall, gating Coach IA).
// Prix : Essentiel 10€/mois · Pro 19€/mois · Lifetime 89€ (paiement unique).
// Whop : les IDs de plan viennent de l'env (le user les colle) → checkout réel.

import type { BillingPlanId } from "@/types";

export interface VisionFeature {
  label: string;
  on: boolean;
  /** Ligne « Coach IA » (icône dédiée). */
  coach?: boolean;
}

export interface VisionPlan {
  id: BillingPlanId;
  name: string;
  price: number;
  cadence: string;
  tagline: string;
  highlighted?: boolean;
  badge?: string;
  /** Questions/jour au Coach IA. Infinity = illimité. */
  coachPerDay: number;
  features: VisionFeature[];
  cta: string;
}

export const PREDISCORE_PLANS: VisionPlan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: 10,
    cadence: "/mois",
    tagline: "Pour découvrir l'analyse IA",
    coachPerDay: 0,
    features: [
      { label: "1 analyse complète par jour", on: true },
      { label: "Probabilités exactes (1-N-2)", on: true },
      { label: "Score le plus probable", on: true },
      { label: "Scénario du match par l'IA", on: true },
      { label: "Tous les marchés détaillés", on: false },
      { label: "Coach IA (questions)", on: false, coach: true },
    ],
    cta: "Choisir Essentiel",
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    cadence: "/mois",
    tagline: "Pour les passionnés de foot",
    highlighted: true,
    badge: "Le plus populaire",
    coachPerDay: 1,
    features: [
      { label: "Analyses illimitées", on: true },
      { label: "Analyse complète détaillée", on: true },
      { label: "Grille des scores & 15+ marchés", on: true },
      { label: "Données live & cotes du marché", on: true },
      { label: "Coach IA — 1 question / jour", on: true, coach: true },
    ],
    cta: "Passer Pro",
  },
  {
    id: "lifetime",
    name: "À vie",
    price: 89,
    cadence: "une seule fois",
    tagline: "Tu paies une fois, c'est à toi",
    badge: "Paiement unique",
    coachPerDay: Infinity,
    features: [
      { label: "Tout PrediScore Pro, sans limite", on: true },
      { label: "Accès à vie · zéro abonnement", on: true },
      { label: "Coach IA illimité", on: true, coach: true },
      { label: "Priorité sur les nouvelles features", on: true },
      { label: "Toutes les futures mises à jour", on: true },
    ],
    cta: "Accès à vie",
  },
];

export function getPrediscorePlan(id: BillingPlanId): VisionPlan | undefined {
  return PREDISCORE_PLANS.find((p) => p.id === id);
}

// Questions/jour au Coach IA pour un plan donné (0 si pas d'abonnement).
export function coachPerDay(planId: BillingPlanId | null | undefined): number {
  if (!planId) return 0;
  return getPrediscorePlan(planId)?.coachPerDay ?? 0;
}

// --- Whop ------------------------------------------------------------------
// IDs de plan lus dans l'env (SERVER). Tant qu'ils ne sont pas posés, le CTA
// renvoie vers /connexion (connexion d'abord).
function envFirst(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function whopPlanEnvFor(id: BillingPlanId): string | undefined {
  const values: Record<BillingPlanId, string | undefined> = {
    essentiel: envFirst(
      "WHOP_PLAN_ESSENTIEL",
      "WHOP_ESSENTIEL_PLAN_ID",
      "WHOP_PLAN_ESSENTIAL",
      "WHOP_ESSENTIAL_PLAN_ID",
    ),
    pro: envFirst("WHOP_PLAN_PRO", "WHOP_PRO_PLAN_ID"),
    lifetime: envFirst(
      "WHOP_PLAN_LIFETIME",
      "WHOP_LIFETIME_PLAN_ID",
      "WHOP_PLAN_A_VIE",
      "WHOP_A_VIE_PLAN_ID",
    ),
  };
  return values[id];
}

export function normalizeWhopPlanId(value: string | null | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (raw.startsWith("plan_")) return raw.split(/[?#/]/)[0];

  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    const planPart = parts.find((part) => part.startsWith("plan_"));
    if (planPart) return planPart;
    const checkoutIndex = parts.findIndex((part) => part === "checkout");
    if (checkoutIndex >= 0 && parts[checkoutIndex + 1]) {
      return parts[checkoutIndex + 1];
    }
  } catch {
    // Valeur non-URL : on tente quand même d'extraire un plan_.
  }

  const match = raw.match(/plan_[A-Za-z0-9_-]+/);
  if (match) return match[0];
  return raw.replace(/^\/+|\/+$/g, "");
}

export function whopPlanIdFor(id: BillingPlanId): string | undefined {
  return normalizeWhopPlanId(whopPlanEnvFor(id));
}

export function whopUrlFor(id: BillingPlanId, email?: string): string | null {
  const planId = whopPlanIdFor(id);
  if (!planId) return null;
  const qs = email ? `?email=${encodeURIComponent(email)}` : "";
  return `https://whop.com/checkout/${planId}${qs}`;
}

export function planByWhopPlanId(whopPlanId: string): VisionPlan | undefined {
  const normalized = normalizeWhopPlanId(whopPlanId);
  return PREDISCORE_PLANS.find((p) => whopPlanIdFor(p.id) === normalized);
}

export function whopConfigured(): boolean {
  return Boolean(whopPlanIdFor("essentiel") && whopPlanIdFor("pro") && whopPlanIdFor("lifetime"));
}
