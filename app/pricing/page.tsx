import Link from "next/link";
import { ArrowLeft, Check, X, Crown, Zap, Infinity as InfinityIcon, MessageSquare } from "lucide-react";
import { PREDISCORE_PLANS, whopPlanIdFor, whopUrlFor } from "@/lib/billing/prediscore";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SITE_NAME } from "@/lib/constants/config";

export const metadata = { title: "Tarifs" };
export const dynamic = "force-dynamic";

const ICONS = { essentiel: Zap, pro: Crown, lifetime: InfinityIcon } as const;

export default function PricingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="blob-emerald absolute -left-24 top-0 h-[420px] w-[420px] rounded-full blur-3xl" />
        <div className="blob-gold absolute right-0 top-40 h-[420px] w-[420px] rounded-full blur-3xl opacity-40" />
        <div className="pitch-lines absolute inset-0 opacity-30" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Link>
        <BrandMark href="/" />
        <Link href="/connexion?next=%2Fapp" className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95">
          Ouvrir l'app
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-8">
        <div className="text-center">
          <h1 className="display-title text-4xl sm:text-5xl">CHOISIS TON PLAN</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Accède à des analyses complètes et des pronostics détaillés. Sans engagement, annulable à tout moment.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PREDISCORE_PLANS.map((plan) => {
            const Icon = ICONS[plan.id as keyof typeof ICONS] ?? Zap;
            const planConfigured = Boolean(whopPlanIdFor(plan.id));
            const url = whopUrlFor(plan.id);
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border p-7 ${
                  plan.highlighted
                    ? "border-primary/50 bg-gradient-to-b from-primary/[0.12] to-card/40 shadow-glow"
                    : "border-border bg-card/40"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      plan.highlighted ? "bg-brand-gradient text-primary-foreground" : "border border-gold/40 bg-gold/10 text-gold-soft"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-brand-soft">{plan.price}€</span>
                  <span className="text-sm text-muted-foreground">{plan.cadence}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                {plan.id === "lifetime" && (
                  <p className="mt-1 text-xs font-medium text-gold">Économise +140€/an vs mensuel</p>
                )}

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat.label} className="flex items-start gap-2.5 text-sm">
                      {feat.on ? (
                        feat.coach ? (
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        )
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={feat.on ? "text-foreground/90" : "text-muted-foreground/60 line-through"}>
                        {feat.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={url ?? "/pricing"}
                  className={`mt-7 flex h-12 items-center justify-center rounded-xl font-semibold transition ${
                    !planConfigured
                      ? "cursor-not-allowed border border-border text-muted-foreground"
                      : plan.highlighted
                      ? "bg-brand-gradient text-primary-foreground shadow-glow hover:opacity-95"
                      : "border border-border hover:bg-card"
                  }`}
                  aria-disabled={!planConfigured}
                >
                  {planConfigured ? plan.cta : "Configuration Whop manquante"}
                </Link>
                {!planConfigured && (
                  <p className="mt-2 text-center text-[11px] text-gold-soft">
                    Ajoute l'ID Whop de ce plan dans l'environnement pour activer le checkout.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground/70">
          {SITE_NAME} fournit des analyses à titre informatif uniquement. Aucune garantie de gain.
          Réservé aux personnes majeures (18+).
        </p>
      </section>
    </div>
  );
}
