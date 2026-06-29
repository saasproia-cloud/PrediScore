"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, Trophy, Calendar, Users, Shield, Lock, Sparkles } from "lucide-react";
import type { StandingRow, Fixture, League, PlayerStat } from "@/types/football";
import { cn } from "@/lib/utils";

type TabId = "analyse" | "classement" | "matchs" | "joueurs" | "equipes";

export function CompetitionTabs({
  league,
  standings,
  fixtures,
  topScorers,
  premium,
}: {
  league: League;
  standings: StandingRow[];
  fixtures: Fixture[];
  topScorers: PlayerStat[];
  premium: boolean;
}) {
  const [tab, setTab] = useState<TabId>("classement");

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; count?: number }[] = [
    { id: "analyse", label: "Analyse", icon: BarChart3 },
    { id: "classement", label: "Classement", icon: Trophy, count: standings.length || undefined },
    { id: "matchs", label: "Matchs", icon: Calendar, count: fixtures.length || undefined },
    { id: "joueurs", label: "Joueurs", icon: Users },
    { id: "equipes", label: "Équipes", icon: Shield, count: standings.length || undefined },
  ];

  return (
    <div>
      {/* barre d'onglets */}
      <div className="app-panel-muted mb-5 flex gap-2 overflow-x-auto rounded-lg p-1.5 sm:mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition sm:px-4",
                active
                  ? "border-primary/50 bg-primary/[0.15] text-primary"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.count != null && (
                <span className={cn("rounded px-1.5 text-[10px]", active ? "bg-primary/20" : "bg-muted")}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "analyse" && <AnalysePremium league={league} standings={standings} fixtures={fixtures} topScorers={topScorers} premium={premium} />}
      {tab === "classement" && <Standings rows={standings} />}
      {tab === "matchs" && <Matches fixtures={fixtures} />}
      {tab === "joueurs" && <Players rows={topScorers} />}
      {tab === "equipes" && <TeamsGrid rows={standings} />}
    </div>
  );
}

// Onglet ANALYSE = payant (comme prediscore). Le reste des onglets est gratuit.
function AnalysePremium({
  league,
  standings,
  fixtures,
  topScorers,
  premium,
}: {
  league: League;
  standings: StandingRow[];
  fixtures: Fixture[];
  topScorers: PlayerStat[];
  premium: boolean;
}) {
  if (premium) {
    const contenders = standings.slice(0, 4);
    const maxPoints = Math.max(1, ...contenders.map((row) => row.points));
    return (
      <div className="space-y-4">
        <section className="app-panel relative overflow-hidden rounded-lg p-5 sm:p-6">
          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Analyse active
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">{league.name}</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Lecture rapide du classement, des dynamiques et des prochains matchs à fort intérêt.
            </p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="app-panel-muted rounded-lg p-5">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Favoris du moment</h4>
            {contenders.length ? (
              <div className="space-y-3">
                {contenders.map((row, index) => {
                  const strength = Math.max(18, Math.round((row.points / maxPoints) * 100));
                  return (
                    <div key={row.team.id}>
                      <div className="mb-1 flex items-center gap-2 text-sm">
                        <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
                        {row.team.logo && <Image src={row.team.logo} alt="" width={22} height={22} className="h-5 w-5 object-contain" />}
                        <span className="flex-1 font-semibold">{row.team.name}</span>
                        <span className="text-xs text-primary">{strength}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${strength}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty>Analyse de favoris disponible dès que le classement live répond.</Empty>
            )}
          </div>

          <div className="app-panel-muted rounded-lg p-5">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">À surveiller</h4>
            <div className="space-y-3">
              {topScorers.slice(0, 3).map((player) => (
                <div key={player.id} className="app-hover flex items-center gap-3 rounded-lg border border-border/70 bg-background/40 p-3">
                  {player.photo ? (
                    <Image src={player.photo} alt="" width={34} height={34} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{player.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{player.team.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-brand-soft">{player.goals}</div>
                    <div className="text-[10px] text-muted-foreground">buts</div>
                  </div>
                </div>
              ))}
              {!topScorers.length && <Empty>Les joueurs clés s'afficheront quand API-Football les fournit.</Empty>}
            </div>
          </div>
        </div>

        <div className="app-panel-muted rounded-lg p-5">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Matchs à analyser</h4>
          <Matches fixtures={fixtures.slice(0, 5)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-panel relative overflow-hidden rounded-lg p-6 text-center sm:p-10">
      <div className="blob-gold pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl opacity-45" />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.15] text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold">Analyse de compétition — Premium</h3>
        <p className="text-sm text-muted-foreground">
          Accède aux prédictions de classement final, probabilités de titre, de qualification
          européenne et de relégation, buteurs probables et forces/faiblesses par équipe.
        </p>
        <Link
          href="/app/subscription"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-gradient px-6 font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
        >
          <Sparkles className="h-4 w-4" /> Passer Premium
        </Link>
      </div>
    </div>
  );
}

function Standings({ rows }: { rows: StandingRow[] }) {
  if (!rows.length)
    return <Empty>Classement disponible en live une fois la clé API-Football connectée.</Empty>;
  return (
    <div className="app-panel-muted overflow-x-auto rounded-lg">
      <div className="min-w-[520px]">
        <div className="grid grid-cols-[28px_1fr_repeat(6,32px)_44px] gap-1 border-b border-border px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>#</span>
          <span>Équipe</span>
          <span className="text-center">MJ</span>
          <span className="text-center">V</span>
          <span className="text-center">N</span>
          <span className="text-center">D</span>
          <span className="text-center">Diff</span>
          <span className="text-center">Pts</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.team.id}
            className="grid grid-cols-[28px_1fr_repeat(6,32px)_44px] items-center gap-1 px-3 py-2 text-sm"
          >
            <span className="text-xs text-muted-foreground">{r.rank}</span>
            <span className="flex min-w-0 items-center gap-2 truncate">
              {r.team.logo && <Image src={r.team.logo} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />}
              <span className="truncate">{r.team.name}</span>
            </span>
            <span className="text-center text-xs text-muted-foreground">{r.played}</span>
            <span className="text-center text-xs text-muted-foreground">{r.wins}</span>
            <span className="text-center text-xs text-muted-foreground">{r.draws}</span>
            <span className="text-center text-xs text-muted-foreground">{r.losses}</span>
            <span className="text-center text-xs text-muted-foreground">{r.goalDiff > 0 ? "+" : ""}{r.goalDiff}</span>
            <span className="text-center font-semibold text-brand-soft">{r.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Matches({ fixtures }: { fixtures: Fixture[] }) {
  if (!fixtures.length) return <Empty>Aucun match à venir pour l'instant.</Empty>;
  return (
    <div className="space-y-2">
      {fixtures.map((fx) => (
        <Link
          key={fx.id}
          href={`/app?fixtureId=${fx.id}`}
          className="app-hover grid gap-2 rounded-lg border border-border bg-card/40 p-3 text-sm sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center sm:gap-3"
        >
          <span className="flex min-w-0 items-center gap-2 sm:justify-end sm:text-right">
            <span className="min-w-0 truncate font-medium">{fx.home.name}</span>
            {fx.home.logo && <Image src={fx.home.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
          </span>
          <span className="w-fit rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">VS</span>
          <span className="flex min-w-0 items-center gap-2">
            {fx.away.logo && <Image src={fx.away.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
            <span className="min-w-0 truncate font-medium">{fx.away.name}</span>
          </span>
          <Sparkles className="hidden h-4 w-4 shrink-0 text-primary sm:block" />
        </Link>
      ))}
    </div>
  );
}

function TeamsGrid({ rows }: { rows: StandingRow[] }) {
  if (!rows.length) return <Empty>Équipes disponibles en live une fois la clé connectée.</Empty>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {rows.map((r) => (
        <Link
          key={r.team.id}
          href={`/app?team=${encodeURIComponent(r.team.name)}&teamId=${r.team.id}`}
          className="app-hover flex items-center gap-3 rounded-lg border border-border bg-card/40 p-3"
        >
          {r.team.logo && <Image src={r.team.logo} alt="" width={28} height={28} className="h-7 w-7 object-contain" />}
          <span className="truncate text-sm font-medium">{r.team.name}</span>
        </Link>
      ))}
    </div>
  );
}

function Players({ rows }: { rows: PlayerStat[] }) {
  if (!rows.length) return <Empty>Les statistiques joueurs s'afficheront ici dès que ton plan API-Football les couvre.</Empty>;
  return (
    <div className="app-panel-muted overflow-hidden rounded-lg">
      <div className="grid grid-cols-[32px_1fr_48px_48px] gap-2 border-b border-border px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>#</span>
        <span>Joueur</span>
        <span className="text-center">Buts</span>
        <span className="text-center">Passes</span>
      </div>
      {rows.map((p, i) => (
        <div key={p.id} className="grid grid-cols-[32px_1fr_48px_48px] items-center gap-2 px-3 py-2 text-sm">
          <span className="text-xs text-muted-foreground">{i + 1}</span>
          <span className="flex min-w-0 items-center gap-2">
            {p.photo ? (
              <Image src={p.photo} alt="" width={26} height={26} className="h-6 w-6 rounded-full object-cover" />
            ) : p.team.logo ? (
              <Image src={p.team.logo} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            ) : (
              <span className="h-6 w-6 rounded-full bg-muted" />
            )}
            <span className="min-w-0">
              <span className="block truncate font-medium">{p.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{p.team.name}</span>
            </span>
          </span>
          <span className="text-center font-semibold text-brand-soft">{p.goals}</span>
          <span className="text-center text-xs text-muted-foreground">{p.assists ?? "-"}</span>
        </div>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-panel-muted rounded-lg p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
