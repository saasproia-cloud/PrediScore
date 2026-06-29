import Link from "next/link";
import { Check, Crown, Infinity as InfinityIcon, MessageSquare, X, Zap } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement } from "@/lib/data/entitlement";
import { getPrediscorePlan, PREDISCORE_PLANS, whopPlanIdFor, whopUrlFor } from "@/lib/billing/prediscore";
import { SITE_NAME } from "@/lib/constants/config";
import type { BillingPlanId } from "@/types";

export const metadata = { title: "Abonnement" };
export const dynamic = "force-dynamic";

const ICONS = { essentiel: Zap, pro: Crown, lifetime: InfinityIcon } as const;

async function account() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { email: null, planId: null as BillingPlanId | null, active: false };
    const ent = await loadEntitlement(supabase, user.email);
    const planId = ent.active && ent.planId && getPrediscorePlan(ent.planId) ? ent.planId : null;
    return { email: user.email.toLowerCase(), planId, active: Boolean(planId) };
  } catch {
    return { email: null, planId: null as BillingPlanId | null, active: false };
  }
}

export default async function SubscriptionPage() {
  const acc = await account();

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="app-panel rounded-lg p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Crown className="h-3.5 w-3.5" /> Abonnement
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Gère ton accès {SITE_NAME}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Les analyses complètes et le Coach IA sont débloqués uniquement quand le paiement Whop
          est confirmé côté serveur.
        </p>
      </header>

      <section className="app-panel-muted rounded-lg p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Plan actuel</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {acc.active && acc.planId ? `Tu es sur le plan ${labelFor(acc.planId)}.` : "Aucun abonnement actif."}
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
            {acc.email ?? "Compte non chargé"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3 xl:gap-5">
        {PREDISCORE_PLANS.map((plan) => {
          const Icon = ICONS[plan.id as keyof typeof ICONS] ?? Zap;
          const configured = Boolean(whopPlanIdFor(plan.id));
          const active = acc.active && acc.planId === plan.id;
          const url = whopUrlFor(plan.id, acc.email ?? undefined);
          const tone =
            plan.id === "essentiel"
              ? "border-sky-300/[0.35] bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.22),transparent_34%),linear-gradient(145deg,rgba(8,18,30,0.94),rgba(12,33,45,0.82))]"
              : plan.id === "pro"
                ? "border-emerald-300/[0.45] bg-[radial-gradient(circle_at_18%_12%,rgba(52,211,153,0.28),transparent_34%),radial-gradient(circle_at_80%_16%,rgba(34,211,238,0.20),transparent_32%),linear-gradient(145deg,rgba(5,20,20,0.95),rgba(9,55,42,0.84))] shadow-[0_24px_90px_rgba(16,185,129,0.18)]"
                : "border-gold/[0.45] bg-[radial-gradient(circle_at_18%_12%,hsl(var(--gold)/0.28),transparent_34%),radial-gradient(circle_at_86%_20%,hsl(var(--gold-soft)/0.16),transparent_34%),linear-gradient(145deg,rgba(24,21,8,0.95),rgba(48,40,14,0.84))] shadow-[0_24px_90px_hsl(var(--gold)/0.14)]";
          return (
            <article
              key={plan.id}
              className={`app-hover relative flex flex-col overflow-hidden rounded-lg border p-5 sm:p-6 ${tone}`}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              {plan.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-white/[0.12] px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/[0.15] sm:right-5 sm:top-5 sm:px-3 sm:text-xs">
                  {plan.badge}
                </span>
              )}
              <div className="relative flex min-w-0 items-center gap-2 pr-20">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="min-w-0 truncate text-lg font-bold">{plan.name}</h2>
                {active && (
                  <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Actif
                  </span>
                )}
              </div>
              <div className="relative mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-brand-soft">{plan.price}€</span>
                <span className="text-sm text-muted-foreground">{plan.cadence}</span>
              </div>
              <p className="relative mt-2 text-sm text-white/[0.68]">{plan.tagline}</p>

              <ul className="relative mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2.5 text-sm">
                    {feature.on ? (
                      feature.coach ? (
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <span className={feature.on ? "text-foreground/90" : "text-muted-foreground/60 line-through"}>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={active ? "/app" : url ?? "/app/subscription"}
                aria-disabled={!configured || active}
                className={`mt-7 flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition ${
                  active
                    ? "border border-border text-muted-foreground"
                    : configured
                      ? plan.id === "lifetime"
                        ? "bg-gold-gradient text-gold-foreground shadow-[0_16px_38px_hsl(var(--gold)/0.22)] hover:scale-[1.01]"
                        : "bg-brand-gradient text-primary-foreground shadow-[0_16px_38px_hsl(var(--primary)/0.22)] hover:scale-[1.01]"
                      : "cursor-not-allowed border border-border text-muted-foreground"
                }`}
              >
                {active ? "Plan actif" : configured ? plan.cta : "Configuration Whop manquante"}
              </Link>
            </article>
          );
        })}
      </section>

    </div>
  );
}

function labelFor(planId: BillingPlanId) {
  if (planId === "essentiel") return "Essentiel";
  if (planId === "pro") return "Pro";
  return "À vie";
}
