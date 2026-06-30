"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  ShieldCheck,
  Flame,
  Check,
  MessageSquare,
  Trophy,
} from "lucide-react";
import type { AnalyzeResponse } from "@/types/analysis";
import type { TeamRef, TeamStats } from "@/types/football";
import type { MatchPrediction } from "@/lib/engine/predict";
import type { MatchNarrative } from "@/lib/ai/match-narrative";
import { cn } from "@/lib/utils";

// % lisible : entier ≥ 10 %, 1 décimale en dessous.
function f(p: number): string {
  const v = p * 100;
  return v >= 9.95 ? `${Math.round(v)}%` : `${v.toFixed(1)}%`;
}

function Logo({ team, size = 40 }: { team: TeamRef; size?: number }) {
  if (!team.logo)
    return <div className="rounded-full bg-muted" style={{ width: size, height: size }} />;
  return (
    <Image
      src={team.logo}
      alt={team.name}
      width={size}
      height={size}
      unoptimized
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}

const COUNTRY_FLAGS: Record<string, string> = {
  france: "🇫🇷",
  england: "🏴",
  spain: "🇪🇸",
  germany: "🇩🇪",
  italy: "🇮🇹",
  portugal: "🇵🇹",
  morocco: "🇲🇦",
  netherlands: "🇳🇱",
  belgium: "🇧🇪",
  brazil: "🇧🇷",
  argentina: "🇦🇷",
  norway: "🇳🇴",
  sweden: "🇸🇪",
  denmark: "🇩🇰",
  turkey: "🇹🇷",
  türkiye: "🇹🇷",
  usa: "🇺🇸",
  "united states": "🇺🇸",
  japan: "🇯🇵",
  mexico: "🇲🇽",
  canada: "🇨🇦",
  switzerland: "🇨🇭",
  austria: "🇦🇹",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  ireland: "🇮🇪",
};

function countryFlag(country?: string) {
  if (!country) return null;
  return COUNTRY_FLAGS[country.trim().toLowerCase()] ?? null;
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      {children}
    </h3>
  );
}

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

export function AnalysisResult({ data }: { data: AnalyzeResponse }) {
  if (data.postMatch) return <PostMatchSummary data={data} />;
  if (!data.prediction || !data.narrative) return <FreeTeaser data={data} />;
  return <FullAnalysis data={data} prediction={data.prediction} narrative={data.narrative} />;
}

function PostMatchSummary({ data }: { data: AnalyzeResponse }) {
  const match = data.postMatch!;
  const max = Math.max(1, ...match.stats.flatMap((s) => [s.home, s.away]));
  return (
    <div className="space-y-5">
      <div className="app-panel rounded-lg p-4 text-center sm:p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-soft">
          <Trophy className="h-3.5 w-3.5" /> Match terminé · résumé gratuit
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
          <div className="min-w-0">
            <Logo team={data.teams.home} size={56} />
            <div className="mt-2 truncate text-sm font-semibold">{data.teams.home.name}</div>
          </div>
          <div>
            <div className="text-4xl font-black tracking-tight text-brand-soft sm:text-5xl">
              {match.finalScore.home}–{match.finalScore.away}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Score final
            </div>
          </div>
          <div className="min-w-0">
            <Logo team={data.teams.away} size={56} />
            <div className="mt-2 truncate text-sm font-semibold">{data.teams.away.name}</div>
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-foreground/85">
          {match.summary}
        </p>
      </div>

      <div className="app-panel-muted rounded-lg p-4 sm:p-5">
        <SectionTitle icon={<Activity className="h-4 w-4" />}>Graphiques du match</SectionTitle>
        <div className="space-y-4">
          {match.stats.map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-foreground">{row.home}{row.suffix ?? ""}</span>
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground">{row.away}{row.suffix ?? ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex justify-end">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(6, (row.home / max) * 100)}%` }}
                    className="h-2 rounded-l-full bg-primary"
                  />
                </div>
                <div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(6, (row.away / max) * 100)}%` }}
                    className="h-2 rounded-r-full bg-gold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ VUE GRATUITE (verrouillée) ============================ */
// Résumé rapide + forme/victoires des deux équipes. AUCUN score, AUCUN pourcentage.

function recentWins(form: string) {
  return (form.match(/W/gi) || []).length;
}

function FormBadges({ form }: { form: string }) {
  const last = (form || "").slice(-5).split("");
  return (
    <div className="flex gap-1">
      {last.map((r, i) => (
        <span
          key={i}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold",
            r === "W" && "bg-primary/20 text-primary",
            r === "D" && "bg-gold/20 text-gold",
            r === "L" && "bg-rose-500/20 text-rose-400",
          )}
        >
          {r === "W" ? "V" : r === "D" ? "N" : "D"}
        </span>
      ))}
    </div>
  );
}

function TeamFormCard({ stats }: { stats: TeamStats }) {
  return (
    <div className="app-panel-muted rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex min-w-0 items-center gap-3">
        <Logo team={stats.team} size={36} />
        <span className="min-w-0 truncate font-semibold">{stats.team.name}</span>
      </div>
      <div className="mb-3">
        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">5 derniers matchs</div>
        <FormBadges form={stats.form} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-background/50 p-2">
          <div className="text-lg font-bold text-primary">{stats.wins}</div>
          <div className="text-[10px] text-muted-foreground">Victoires</div>
        </div>
        <div className="rounded-lg bg-background/50 p-2">
          <div className="text-lg font-bold text-gold">{stats.draws}</div>
          <div className="text-[10px] text-muted-foreground">Nuls</div>
        </div>
        <div className="rounded-lg bg-background/50 p-2">
          <div className="text-lg font-bold text-rose-400">{stats.losses}</div>
          <div className="text-[10px] text-muted-foreground">Défaites</div>
        </div>
      </div>
    </div>
  );
}

function FreeTeaser({ data }: { data: AnalyzeResponse }) {
  const { teams } = data;
  const h = teams.homeStats;
  const a = teams.awayStats;
  const quotaReached = data.access.reason === "quota";

  return (
    <div className="space-y-5">
      {/* en-tête SANS score */}
      <div className="app-panel rounded-lg p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Aperçu gratuit
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-5">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <Logo team={teams.home} size={52} />
            <span className="max-w-full truncate text-sm font-semibold">{teams.home.name}</span>
          </div>
          <span className="pt-5 text-sm font-extrabold text-muted-foreground">VS</span>
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <Logo team={teams.away} size={52} />
            <span className="max-w-full truncate text-sm font-semibold">{teams.away.name}</span>
          </div>
        </div>
      </div>

      {/* résumé rapide qualitatif (sans chiffres de prédiction) */}
      <div className="app-panel-muted rounded-lg p-4 sm:p-5">
        <SectionTitle icon={<Activity className="h-4 w-4" />}>
          {quotaReached ? "Quota du jour atteint" : "Résumé rapide"}
        </SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/[0.85]">
          {quotaReached
            ? `Ton plan a déjà utilisé son analyse complète du jour. Tu peux encore consulter l'aperçu de ${teams.home.name} contre ${teams.away.name}, puis repasser demain ou passer Pro pour analyser sans limite.`
            : `${teams.home.name} et ${teams.away.name} se livrent un duel attendu. Sur leurs 5 derniers matchs, ${teams.home.name} compte ${recentWins(h.form)} victoire${recentWins(h.form) > 1 ? "s" : ""} et ${teams.away.name} ${recentWins(a.form)}. Le détail du vainqueur probable, du score exact et de toutes les probabilités est réservé à l'analyse complète.`}
        </p>
      </div>

      {/* forme des deux équipes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamFormCard stats={h} />
        <TeamFormCard stats={a} />
      </div>

      <Paywall />

    </div>
  );
}

// Paywall clair : carte de valeur + CTA, sans faux flou de données côté client.
function Paywall() {
  const items = [
    "Le vainqueur probable + les probabilités exactes (1-N-2)",
    "Le score le plus probable & la grille complète des scores",
    "Le scénario du match rédigé par l'IA",
    "15+ marchés : +/- buts, BTTS, double chance, clean sheet…",
    "Le niveau de confiance détaillé de l'analyse",
  ];
  return (
    <div className="relative overflow-hidden rounded-lg border border-emerald-300/[0.35] bg-[radial-gradient(circle_at_12%_10%,rgba(52,211,153,0.24),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.24),transparent_34%),linear-gradient(135deg,rgba(6,18,24,0.95),rgba(13,40,32,0.9)_52%,rgba(71,48,8,0.62))] p-4 shadow-[0_24px_80px_rgba(16,185,129,0.18)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-primary/[0.16] blur-3xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.12] text-emerald-200 ring-1 ring-white/20">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold">Débloque le verdict complet</h3>
            <p className="text-xs text-white/[0.62]">Score probable, marchés clés, scénario IA et confiance du modèle.</p>
          </div>
        </div>
        <ul className="mb-5 space-y-2">
          {items.map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm text-foreground/[0.85]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              {it}
            </li>
          ))}
          <li className="flex items-start gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" />
            Coach IA : pose tes questions sur le match (Pro & À vie)
          </li>
        </ul>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/app/subscription"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient font-extrabold text-primary-foreground shadow-[0_16px_40px_hsl(var(--primary)/0.24)] transition hover:scale-[1.01] sm:w-auto sm:px-7"
          >
            Débloquer — à partir de 10€
          </Link>
          <span className="text-xs text-white/[0.62]">Accès immédiat après paiement</span>
        </div>
      </div>
    </div>
  );
}

/* ============================ VUE COMPLÈTE (payante) ============================ */

function FullAnalysis({
  data,
  prediction: p,
  narrative,
}: {
  data: AnalyzeResponse;
  prediction: MatchPrediction;
  narrative: MatchNarrative;
}) {
  const { teams } = data;
  const o = p.markets.outcome;
  const ou25 = p.markets.overUnder.find((l) => l.line === 2.5)!;
  const maxCell = Math.max(...p.scoreGrid.flat());
  const confColor =
    p.confidence.score >= 64 ? "text-primary" : p.confidence.score >= 42 ? "text-gold" : "text-rose-400";
  const winnerTeam =
    p.winner.key === "home" ? teams.home : p.winner.key === "away" ? teams.away : null;
  const loserTeam =
    p.winner.key === "home" ? teams.away : p.winner.key === "away" ? teams.home : null;
  const winnerName = winnerTeam?.name ?? "Match nul";
  const winnerFlag = winnerTeam ? countryFlag(winnerTeam.country) : null;
  const favoriteAngle = Math.round(p.winner.probability * 360);
  const likelyScore = p.markets.mostLikelyScore;

  return (
    <div className="space-y-5">
      {/* Verdict principal : vainqueur d'abord, score ensuite. */}
      <motion.div
        variants={fade}
        custom={0}
        initial="hidden"
        animate="show"
        className="app-panel relative overflow-hidden rounded-lg p-4 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/[0.14] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-primary/[0.16] blur-3xl" />
        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-xs font-bold text-gold-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Verdict IA
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-black/[0.18] px-3 py-1.5 text-xs text-muted-foreground">
              <Logo team={teams.home} size={20} />
              <span className="max-w-[110px] truncate sm:max-w-[180px]">{teams.home.name}</span>
              <span className="text-white/35">vs</span>
              <Logo team={teams.away} size={20} />
              <span className="max-w-[110px] truncate sm:max-w-[180px]">{teams.away.name}</span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                {winnerTeam ? "Vainqueur probable" : "Issue la plus probable"}
              </div>
              <div className="mt-3 flex min-w-0 items-center gap-4">
                <div
                  className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full p-2 shadow-[0_0_42px_hsl(var(--primary)/0.20)]"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${favoriteAngle}deg, hsl(var(--muted)) 0deg)`,
                  }}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center ring-1 ring-white/10">
                    {winnerTeam ? (
                      <Logo team={winnerTeam} size={34} />
                    ) : (
                      <span className="text-lg font-black text-gold">N</span>
                    )}
                    <span className="mt-1 text-xl font-black text-brand-soft">{f(p.winner.probability)}</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {winnerFlag && <span className="text-2xl">{winnerFlag}</span>}
                    <h2 className="truncate text-3xl font-black uppercase leading-none tracking-tight text-brand-soft sm:text-5xl">
                      {winnerName}
                    </h2>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {loserTeam && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        devant {countryFlag(loserTeam.country)} {loserTeam.name}
                      </span>
                    )}
                    <span className="rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1 text-primary">
                      +{f(p.winner.margin)} d'avance
                    </span>
                    <span className={cn("rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1", confColor)}>
                      confiance {p.confidence.score}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg border border-gold/20 bg-[linear-gradient(145deg,hsl(var(--gold)/0.12),hsl(var(--card)/0.72))] p-4 text-center">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-soft">
                  Score possible
                </div>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <Logo team={teams.home} size={34} />
                  <div className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                    {likelyScore.home}<span className="mx-1 text-muted-foreground">-</span>{likelyScore.away}
                  </div>
                  <Logo team={teams.away} size={34} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {teams.home.name} - {teams.away.name}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/[0.16] p-4">
                <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                  Lecture rapide
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="1" value={f(o.home)} active={p.winner.key === "home"} />
                  <MiniStat label="N" value={f(o.draw)} active={p.winner.key === "draw"} />
                  <MiniStat label="2" value={f(o.away)} active={p.winner.key === "away"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Issue 1-N-2 */}
      <motion.div variants={fade} custom={1} initial="hidden" animate="show" className="app-panel-muted rounded-lg p-4 sm:p-5">
        <SectionTitle icon={<TrendingUp className="h-4 w-4" />}>Graphique 1-N-2</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {[
            { label: teams.home.name, v: o.home, key: "home" as const, team: teams.home, tag: "Victoire" },
            { label: "Match nul", v: o.draw, key: "draw" as const, team: null, tag: "Nul" },
            { label: teams.away.name, v: o.away, key: "away" as const, team: teams.away, tag: "Victoire" },
          ].map((x) => (
            <ProbabilityCard
              key={x.key}
              label={x.label}
              tag={x.tag}
              value={x.v}
              team={x.team}
              active={p.winner.key === x.key}
            />
          ))}
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div initial={{ width: 0 }} animate={{ width: `${o.home * 100}%` }} transition={{ duration: 0.7 }} className="bg-primary" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${o.draw * 100}%` }} transition={{ duration: 0.7, delay: 0.1 }} className="bg-muted-foreground/50" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${o.away * 100}%` }} transition={{ duration: 0.7, delay: 0.2 }} className="bg-gold" />
        </div>
      </motion.div>

      {/* Confiance + buts attendus */}
      <motion.div variants={fade} custom={2} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
        <div className="app-panel-muted rounded-lg p-4 sm:p-5">
          <SectionTitle icon={<ShieldCheck className="h-4 w-4" />}>Confiance de l'IA</SectionTitle>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold", confColor)}>{p.confidence.label}</span>
            <span className="text-sm text-muted-foreground">{p.confidence.score}/100</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div initial={{ width: 0 }} animate={{ width: `${p.confidence.score}%` }} transition={{ duration: 0.8 }} className="h-full bg-brand-gradient" />
          </div>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {p.confidence.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-primary">·</span>{r}</li>
            ))}
          </ul>
        </div>
        <div className="app-panel-muted rounded-lg p-4 sm:p-5">
          <SectionTitle icon={<Target className="h-4 w-4" />}>Buts attendus (xG modèle)</SectionTitle>
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-soft">{p.expectedGoals.home}</div>
              <div className="text-xs text-muted-foreground">{teams.home.name}</div>
            </div>
            <span className="text-muted-foreground">—</span>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-soft">{p.expectedGoals.away}</div>
              <div className="text-xs text-muted-foreground">{teams.away.name}</div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">Total attendu : {p.expectedGoals.total} buts</p>
        </div>
      </motion.div>

      {/* Scénario IA */}
      <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="app-panel rounded-lg p-4 sm:p-5">
        <SectionTitle icon={<Activity className="h-4 w-4" />}>Résumé IA</SectionTitle>
        {narrative.verdict && (
          <div className="mb-3 rounded-lg border border-primary/20 bg-primary/[0.08] px-3 py-2 text-sm font-extrabold text-brand-soft">
            {narrative.verdict}
          </div>
        )}
        <p className="text-sm leading-relaxed text-foreground/80">{narrative.scenario}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {narrative.keyFactors.map((k, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg bg-background/40 p-2.5 text-xs text-foreground/[0.85]">
              <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {k}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div variants={fade} custom={4} initial="hidden" animate="show" className="app-panel-muted rounded-lg p-4 sm:p-5">
        <SectionTitle icon={<ShieldCheck className="h-4 w-4" />}>Pourquoi ce pronostic</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {p.modelSignals.map((signal) => (
            <div key={signal.label} className="rounded-lg border border-border/70 bg-background/[0.35] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 truncate text-sm font-semibold">{signal.label}</div>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${signal.strength * 100}%` }} />
                </div>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{signal.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sélections phares */}
      <motion.div variants={fade} custom={5} initial="hidden" animate="show">
        <SectionTitle icon={<Sparkles className="h-4 w-4" />}>Sélections phares</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {p.headlinePicks.map((pick, i) => (
            <div key={i} className="app-hover rounded-lg border border-border bg-card/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{pick.market}</div>
              <div className="mt-1 truncate font-semibold">{pick.pick}</div>
              <div className="mt-1 text-sm font-bold text-primary">{f(pick.prob)}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grille des scores */}
      <div className="app-panel-muted rounded-lg p-4 sm:p-5">
        <SectionTitle icon={<Target className="h-4 w-4" />}>Grille des scores exacts</SectionTitle>
        <div className="flex flex-col gap-4 overflow-x-auto md:flex-row md:gap-3">
          <div className="grid shrink-0" style={{ gridTemplateColumns: `auto repeat(6, minmax(34px, 1fr))` }}>
            <div />
            {Array.from({ length: 6 }).map((_, y) => (
              <div key={y} className="pb-1 text-center text-[10px] text-muted-foreground">{y}</div>
            ))}
            {p.scoreGrid.map((row, x) => (
              <FragmentRow key={x} x={x} row={row} maxCell={maxCell} best={p.markets.mostLikelyScore} />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-xs text-muted-foreground">Scores les plus probables</div>
            <div className="space-y-1.5">
              {p.markets.correctScores.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-9 text-sm font-medium">{s.home}–{s.away}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(s.prob / p.markets.correctScores[0].prob) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs text-muted-foreground">{f(s.prob)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Lignes = buts {teams.home.name} · Colonnes = buts {teams.away.name}</p>
      </div>

      {/* Marchés */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MarketCard title="Plus / Moins de buts">
          {p.markets.overUnder.map((l) => (
            <Row key={l.line} label={`+${l.line} buts`} a={f(l.over)} pa={l.over} />
          ))}
        </MarketCard>
        <MarketCard title="Les deux marquent">
          <Row label="Oui" a={f(p.markets.btts.yes)} pa={p.markets.btts.yes} />
          <Row label="Non" a={f(p.markets.btts.no)} pa={p.markets.btts.no} />
        </MarketCard>
        <MarketCard title="Double chance">
          <Row label={`${teams.home.name} ou nul`} a={f(p.markets.doubleChance.homeOrDraw)} pa={p.markets.doubleChance.homeOrDraw} />
          <Row label={`${teams.away.name} ou nul`} a={f(p.markets.doubleChance.awayOrDraw)} pa={p.markets.doubleChance.awayOrDraw} />
          <Row label="Pas de nul" a={f(p.markets.doubleChance.homeOrAway)} pa={p.markets.doubleChance.homeOrAway} />
        </MarketCard>
        <MarketCard title="Clean sheet">
          <Row label={teams.home.name} a={f(p.markets.cleanSheet.home)} pa={p.markets.cleanSheet.home} />
          <Row label={teams.away.name} a={f(p.markets.cleanSheet.away)} pa={p.markets.cleanSheet.away} />
        </MarketCard>
        <MarketCard title="Tranches de buts">
          {p.markets.goalsBands.map((g) => (
            <Row key={g.label} label={g.label} a={f(g.prob)} pa={g.prob} />
          ))}
        </MarketCard>
        <MarketCard title="Victoire sans encaisser">
          <Row label={teams.home.name} a={f(p.markets.winToNil.home)} pa={p.markets.winToNil.home} />
          <Row label={teams.away.name} a={f(p.markets.winToNil.away)} pa={p.markets.winToNil.away} />
        </MarketCard>
      </div>

    </div>
  );
}

function MiniStat({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2",
        active
          ? "border-primary/35 bg-primary/[0.13] text-primary"
          : "border-white/10 bg-white/[0.035] text-muted-foreground",
      )}
    >
      <div className="text-[10px] font-black uppercase">{label}</div>
      <div className="mt-0.5 text-lg font-black text-foreground">{value}</div>
    </div>
  );
}

function ProbabilityCard({
  label,
  tag,
  value,
  team,
  active,
}: {
  label: string;
  tag: string;
  value: number;
  team: TeamRef | null;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-3 transition",
        active
          ? "border-primary/40 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.18),transparent_48%),hsl(var(--primary)/0.07)] shadow-[0_18px_46px_hsl(var(--primary)/0.11)]"
          : "border-white/10 bg-background/45",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {team ? (
          <Logo team={team} size={30} />
        ) : (
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gold/15 text-xs font-black text-gold">
            N
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-foreground">{label}</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {team ? `${countryFlag(team.country) ?? ""} ${tag}` : tag}
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-3xl font-black tracking-tight text-brand-soft">{f(value)}</div>
        {active && (
          <div className="rounded-full border border-primary/30 bg-primary/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
            favori
          </div>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(3, value * 100)}%` }}
          transition={{ duration: 0.7 }}
          className={cn("h-full rounded-full", active ? "bg-brand-gradient" : "bg-white/35")}
        />
      </div>
    </div>
  );
}

function FragmentRow({ x, row, maxCell, best }: { x: number; row: number[]; maxCell: number; best: { home: number; away: number } }) {
  return (
    <>
      <div className="flex items-center pr-1 text-[10px] text-muted-foreground">{x}</div>
      {row.map((v, y) => {
        const isBest = x === best.home && y === best.away;
        return (
          <div
            key={y}
            className={cn("m-0.5 flex h-8 items-center justify-center rounded text-[10px] font-medium", isBest && "ring-2 ring-primary")}
            style={{ backgroundColor: `hsl(var(--primary) / ${Math.max(0.04, (v / maxCell) * 0.85)})` }}
          >
            {(v * 100).toFixed(0)}
          </div>
        );
      })}
    </>
  );
}

function MarketCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app-panel-muted rounded-lg p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, a, pa }: { label: string; a: string; pa: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="truncate pr-2 text-foreground/[0.85]">{label}</span>
        <span className="font-semibold text-primary">{a}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${pa * 100}%` }} />
      </div>
    </div>
  );
}
