import { MatchAnalyzer } from "@/components/app/match-analyzer";
import { Activity, CheckCircle2, Database, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export const metadata = { title: "Analyse de match" };

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    team?: string;
    teamId?: string;
    fixtureId?: string;
    home?: string;
    away?: string;
    checkout?: string;
  }>;
}) {
  const sp = await searchParams;
  const checkoutSuccess = sp.checkout === "success";
  const initialTeam = sp.team ?? sp.home;
  const initialTeamId = sp.teamId;

  return (
    <div>
      {checkoutSuccess && (
        <div className="app-panel-muted mb-5 rounded-lg p-4 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Paiement reçu</p>
              <p className="mt-1 text-muted-foreground">
                Ton accès PrediScore est en cours d'activation. Si l'analyse complète
                n'est pas encore débloquée, attends quelques secondes puis recharge la page.
              </p>
            </div>
          </div>
        </div>
      )}
      <header className="app-panel mb-5 overflow-hidden rounded-lg p-4 sm:mb-6 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Match Lab
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Analyse de match
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Recherche une équipe, choisis un vrai match à venir, puis lance une analyse structurée avec verdict, score possible et confiance.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-[390px]">
            <HeaderMetric icon={<Database className="h-3.5 w-3.5" />} label="Fixtures" value="Live" />
            <HeaderMetric icon={<Activity className="h-3.5 w-3.5" />} label="Moteur" value="85%+" />
            <HeaderMetric icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Accès" value="Sécurisé" />
          </div>
        </div>
      </header>
      <MatchAnalyzer
        initialTeam={initialTeam}
        initialTeamId={initialTeamId}
        initialFixtureId={sp.fixtureId}
      />
    </div>
  );
}

function HeaderMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-extrabold text-foreground">{value}</div>
    </div>
  );
}
