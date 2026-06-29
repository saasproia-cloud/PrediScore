import Link from "next/link";
import type { ReactNode } from "react";
import { CreditCard, Gauge, Mail, Settings, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement } from "@/lib/data/entitlement";
import { analysisLimitFor, coachLimitFor, getDailyUsage } from "@/lib/data/usage";
import { getPrediscorePlan } from "@/lib/billing/prediscore";
import { SignOutButton } from "@/components/app/sign-out-button";
import type { BillingPlanId } from "@/types";

export const metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

async function settingsAccount() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return {
        email: null,
        planId: null as BillingPlanId | null,
        active: false,
        analysisCount: 0,
        coachCount: 0,
        analysisLimit: 0 as number | null,
        coachLimit: 0 as number | null,
      };
    }
    const ent = await loadEntitlement(supabase, user.email);
    const planId = ent.active && ent.planId && getPrediscorePlan(ent.planId) ? ent.planId : null;
    const usage = await getDailyUsage(user.email);
    const analysisLimit = analysisLimitFor(planId);
    const coachLimit = coachLimitFor(planId);
    return {
      email: user.email.toLowerCase(),
      planId,
      active: Boolean(planId),
      analysisCount: usage.analysisCount,
      coachCount: usage.coachCount,
      analysisLimit: Number.isFinite(analysisLimit) ? analysisLimit : null,
      coachLimit: Number.isFinite(coachLimit) ? coachLimit : null,
    };
  } catch {
    return {
      email: null,
      planId: null as BillingPlanId | null,
      active: false,
      analysisCount: 0,
      coachCount: 0,
      analysisLimit: 0 as number | null,
      coachLimit: 0 as number | null,
    };
  }
}

export default async function SettingsPage() {
  const account = await settingsAccount();
  const plan = account.planId ? getPrediscorePlan(account.planId) : null;

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="app-panel rounded-lg p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Settings className="h-3.5 w-3.5" /> Paramètres
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Compte et préférences</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Retrouve ton accès, tes quotas du jour et les réglages essentiels.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<Mail className="h-4 w-4" />} title="Compte">
          <div className="text-sm font-semibold">{account.email ?? "Session locale"}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ce compte sert à protéger l'accès dashboard et à relier ton paiement Whop.
          </p>
        </InfoCard>

        <InfoCard icon={<CreditCard className="h-4 w-4" />} title="Abonnement">
          <div className="text-sm font-semibold">{plan ? `Plan ${plan.name}` : "Aucun plan actif"}</div>
          <Link href="/app/subscription" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
            Gérer mon abonnement
          </Link>
        </InfoCard>

        <InfoCard icon={<ShieldCheck className="h-4 w-4" />} title="Sécurité">
          <p className="text-xs text-muted-foreground">
            Les analyses complètes sont débloquées uniquement par la vérification serveur Supabase + Whop.
          </p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </InfoCard>
      </section>

      <section className="app-panel-muted rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-primary" /> Quotas du jour
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuotaLine
            label="Analyses complètes"
            count={account.analysisCount}
            limit={account.analysisLimit}
          />
          <QuotaLine
            label="Questions Coach IA"
            count={account.coachCount}
            limit={account.coachLimit}
          />
        </div>
      </section>

      <section className="app-panel-muted rounded-lg p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Préférences</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/[0.35] p-4">
            <div className="text-sm font-medium">Langue</div>
            <div className="mt-1 text-xs text-muted-foreground">Français</div>
          </div>
          <div className="rounded-lg border border-border bg-background/[0.35] p-4">
            <div className="text-sm font-medium">Thème</div>
            <div className="mt-1 text-xs text-muted-foreground">Sombre premium</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="app-panel-muted rounded-lg p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </article>
  );
}

function QuotaLine({ label, count, limit }: { label: string; count: number; limit: number | null }) {
  const unlimited = limit === null;
  const pct = unlimited || !limit ? 100 : Math.min(100, (count / limit) * 100);
  return (
    <div className="rounded-lg border border-border bg-background/[0.35] p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 text-muted-foreground">{unlimited ? `${count} / ∞` : `${count} / ${limit}`}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
