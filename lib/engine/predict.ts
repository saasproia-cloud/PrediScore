// Orchestrateur du moteur : données équipes → prédiction complète.
// C'est le point d'entrée unique appelé par l'API d'analyse.

import type { TeamStats, DecimalOdds } from "@/types/football";
import {
  expectedGoals,
  scoreMatrix,
  DEFAULT_BASELINE,
  DEFAULT_RHO,
  type LeagueBaseline,
} from "./dixon-coles";
import { computeMarkets, type MatchMarkets } from "./markets";
import { deVig, blendOutcome, agreement } from "./odds";
import { computeConfidence, type Confidence } from "./confidence";
import { clamp } from "./poisson";

export interface PredictInput {
  home: TeamStats;
  away: TeamStats;
  baseline?: LeagueBaseline;
  odds?: DecimalOdds | null;
}

export interface HeadlinePick {
  market: string;
  pick: string;
  prob: number;
}

export interface PredictedWinner {
  key: "home" | "draw" | "away";
  label: string;
  probability: number;
  margin: number;
}

export interface ModelSignal {
  label: string;
  detail: string;
  impact: "positive" | "negative" | "neutral";
  strength: number;
}

export interface MatchPrediction {
  home: TeamStats["team"];
  away: TeamStats["team"];
  winner: PredictedWinner;
  expectedGoals: { home: number; away: number; total: number };
  markets: MatchMarkets;
  confidence: Confidence;
  headlinePicks: HeadlinePick[];
  modelSignals: ModelSignal[];
  /** Grille des scores (pour la heatmap) — tronquée à 6×6 pour l'affichage. */
  scoreGrid: number[][];
  meta: {
    hasOdds: boolean;
    marketWeight: number;
    rho: number;
    formAdjusted: boolean;
    recentGames: number;
    dataSignals: string[];
  };
}

// Points par match d'une chaîne de forme ("WWDLW"). Neutre ≈ 1,4 ppg.
function formPpg(form: string): number | null {
  const games = form.replace(/[^WDL]/gi, "").toUpperCase();
  if (!games.length) return null;
  let pts = 0;
  for (const c of games) pts += c === "W" ? 3 : c === "D" ? 1 : 0;
  return pts / games.length;
}

// Multiplicateur de forme MODESTE (±12% max) — la forme récente ajuste, ne
// domine pas (on évite de surréagir au bruit des 5 derniers matchs).
function formMultiplier(form: string): number {
  const ppg = formPpg(form);
  if (ppg == null) return 1;
  return clamp(1 + 0.18 * ((ppg - 1.4) / 1.4), 0.88, 1.12);
}

function pct(n: number): number {
  return Math.round(n * 1000) / 10; // 1 décimale
}

function perGame(total: number | undefined, games: number | undefined, fallback = 0): number {
  if (!games || games <= 0 || total == null || !Number.isFinite(total)) return fallback;
  return total / games;
}

function totalPpg(stats: TeamStats): number {
  if (!stats.played) return formPpg(stats.form) ?? 1.35;
  return (stats.wins * 3 + stats.draws) / stats.played;
}

interface RecentProfile {
  played: number;
  ppg: number;
  goalsFor: number | null;
  goalsAgainst: number | null;
  cleanSheetRate: number;
  failedToScoreRate: number;
}

function recentProfile(stats: TeamStats): RecentProfile {
  const matches = stats.lastMatches?.slice(-8) ?? [];
  if (matches.length) {
    let points = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;
    let failedToScore = 0;
    for (const match of matches) {
      points += match.result === "W" ? 3 : match.result === "D" ? 1 : 0;
      goalsFor += match.goalsFor;
      goalsAgainst += match.goalsAgainst;
      if (match.goalsAgainst === 0) cleanSheets++;
      if (match.goalsFor === 0) failedToScore++;
    }
    return {
      played: matches.length,
      ppg: points / matches.length,
      goalsFor: goalsFor / matches.length,
      goalsAgainst: goalsAgainst / matches.length,
      cleanSheetRate: cleanSheets / matches.length,
      failedToScoreRate: failedToScore / matches.length,
    };
  }

  const form = formPpg(stats.form);
  const played = stats.form.replace(/[^WDL]/gi, "").length;
  return {
    played,
    ppg: form ?? totalPpg(stats),
    goalsFor: null,
    goalsAgainst: null,
    cleanSheetRate: perGame(stats.cleanSheets, stats.played, 0.22),
    failedToScoreRate: perGame(stats.failedToScore, stats.played, 0.22),
  };
}

function ratioMultiplier(
  value: number | null,
  baseline: number,
  sample: number,
  weight: number,
  min = 0.84,
  max = 1.18,
): number {
  if (value == null || baseline <= 0) return 1;
  const sampleWeight = Math.min(1, sample / 6);
  const ratio = clamp(value / baseline, 0.35, 2.8);
  return clamp(1 + (ratio - 1) * weight * sampleWeight, min, max);
}

function suppressByRates(cleanSheetAgainst: number, failedOwn: number): number {
  return clamp(1 - cleanSheetAgainst * 0.08 - failedOwn * 0.07, 0.84, 1.05);
}

function outcomeRanking(outcome: MatchMarkets["outcome"], homeName: string, awayName: string) {
  return [
    { key: "home" as const, label: homeName, prob: outcome.home },
    { key: "draw" as const, label: "Match nul", prob: outcome.draw },
    { key: "away" as const, label: awayName, prob: outcome.away },
  ].sort((a, b) => b.prob - a.prob);
}

function makeWinner(outcome: MatchMarkets["outcome"], homeName: string, awayName: string): PredictedWinner {
  const ranked = outcomeRanking(outcome, homeName, awayName);
  return {
    key: ranked[0].key,
    label: ranked[0].label,
    probability: ranked[0].prob,
    margin: ranked[0].prob - ranked[1].prob,
  };
}

function syncDerivedOutcomeMarkets(markets: MatchMarkets): void {
  const { home, draw, away } = markets.outcome;
  markets.doubleChance = {
    homeOrDraw: home + draw,
    awayOrDraw: away + draw,
    homeOrAway: home + away,
  };
}

function buildSignals({
  home,
  away,
  homeRecent,
  awayRecent,
  winner,
  hasOdds,
  marketWeight,
  xgEdge,
}: {
  home: TeamStats;
  away: TeamStats;
  homeRecent: RecentProfile;
  awayRecent: RecentProfile;
  winner: PredictedWinner;
  hasOdds: boolean;
  marketWeight: number;
  xgEdge: number;
}): ModelSignal[] {
  const signals: ModelSignal[] = [
    {
      label: "Pronostic principal",
      detail: `${winner.label} à ${pct(winner.probability)}% (${pct(winner.margin)} pts d'avance sur l'issue suivante)`,
      impact: winner.margin >= 0.12 ? "positive" : "neutral",
      strength: clamp(winner.margin / 0.25, 0.15, 1),
    },
    {
      label: "Écart xG modèle",
      detail:
        xgEdge >= 0
          ? `${home.team.name} génère +${xgEdge.toFixed(2)} xG estimés`
          : `${away.team.name} génère +${Math.abs(xgEdge).toFixed(2)} xG estimés`,
      impact: Math.abs(xgEdge) >= 0.25 ? "positive" : "neutral",
      strength: clamp(Math.abs(xgEdge) / 1.2, 0.12, 1),
    },
  ];

  const ppgDiff = homeRecent.ppg - awayRecent.ppg;
  if (Math.abs(ppgDiff) >= 0.25) {
    signals.push({
      label: "Forme récente",
      detail:
        ppgDiff > 0
          ? `${home.team.name} arrive avec une meilleure dynamique récente`
          : `${away.team.name} arrive avec une meilleure dynamique récente`,
      impact: "positive",
      strength: clamp(Math.abs(ppgDiff) / 1.5, 0.15, 1),
    });
  }

  const homeCs = homeRecent.cleanSheetRate;
  const awayCs = awayRecent.cleanSheetRate;
  if (Math.max(homeCs, awayCs) >= 0.34) {
    const team = homeCs >= awayCs ? home.team.name : away.team.name;
    signals.push({
      label: "Solidité défensive",
      detail: `${team} garde souvent son but fermé sur la période récente`,
      impact: "positive",
      strength: clamp(Math.max(homeCs, awayCs), 0.15, 1),
    });
  }

  if (hasOdds) {
    signals.push({
      label: "Marché des cotes",
      detail: `Les cotes sont intégrées au modèle avec un poids de ${pct(marketWeight)}`,
      impact: "positive",
      strength: marketWeight,
    });
  }

  return signals.slice(0, 5);
}

export function predictMatch(input: PredictInput): MatchPrediction {
  const { home, away } = input;
  const baseline = input.baseline ?? DEFAULT_BASELINE;

  // 1) Buts attendus à partir des splits dom/ext.
  const xg = expectedGoals(home.home, away.away, baseline);

  // 2) Ajustements multi-signaux : forme, dynamique de buts récente,
  // clean sheets, failed-to-score et niveau global de points/match.
  const formAdjusted = Boolean(home.form || away.form);
  const homeRecent = recentProfile(home);
  const awayRecent = recentProfile(away);
  const avgGoalBaseline = (baseline.homeGoals + baseline.awayGoals) / 2;
  const ppgDiff = clamp((totalPpg(home) - totalPpg(away)) / 3, -1, 1);

  let lambdaHome = xg.home * formMultiplier(home.form);
  lambdaHome *= ratioMultiplier(homeRecent.goalsFor, avgGoalBaseline, homeRecent.played, 0.16);
  lambdaHome *= ratioMultiplier(awayRecent.goalsAgainst, avgGoalBaseline, awayRecent.played, 0.14);
  lambdaHome *= clamp(1 + ppgDiff * 0.1, 0.9, 1.1);
  lambdaHome *= suppressByRates(awayRecent.cleanSheetRate, homeRecent.failedToScoreRate);

  let lambdaAway = xg.away * formMultiplier(away.form);
  lambdaAway *= ratioMultiplier(awayRecent.goalsFor, avgGoalBaseline, awayRecent.played, 0.16);
  lambdaAway *= ratioMultiplier(homeRecent.goalsAgainst, avgGoalBaseline, homeRecent.played, 0.14);
  lambdaAway *= clamp(1 - ppgDiff * 0.1, 0.9, 1.1);
  lambdaAway *= suppressByRates(homeRecent.cleanSheetRate, awayRecent.failedToScoreRate);

  lambdaHome = clamp(lambdaHome, 0.15, 6);
  lambdaAway = clamp(lambdaAway, 0.15, 6);

  // 3) Grille des scores Dixon-Coles + marchés.
  const matrix = scoreMatrix(lambdaHome, lambdaAway, DEFAULT_RHO, 10);
  const markets = computeMarkets(matrix);

  // 4) Mélange avec le marché si des cotes existent.
  const hasOdds = Boolean(input.odds);
  let marketWeight = 0;
  let modelMarketAgreement: number | undefined;
  if (input.odds) {
    const market = deVig(input.odds);
    modelMarketAgreement = agreement(markets.outcome, market);
    const marketRank = outcomeRanking(market, home.team.name, away.team.name);
    const marketClarity = marketRank[0].prob - marketRank[1].prob;
    marketWeight = clamp(0.44 + 0.18 * modelMarketAgreement + 0.18 * Math.min(1, marketClarity / 0.22), 0.45, 0.68);
    markets.outcome = blendOutcome(markets.outcome, market, marketWeight);
    syncDerivedOutcomeMarkets(markets);
  }

  const winner = makeWinner(markets.outcome, home.team.name, away.team.name);

  // 5) Confiance.
  const confidence = computeConfidence({
    homeGames: home.home.played,
    awayGames: away.away.played,
    hasForm: Boolean(home.form && away.form),
    hasSplits: home.home.played > 0 && away.away.played > 0,
    hasOdds,
    modelMarketAgreement,
    recentGames: Math.min(homeRecent.played, awayRecent.played),
    favoriteProbability: winner.probability,
    favoriteGap: winner.margin,
  });

  // 6) Sélections phares.
  const o = markets.outcome;
  const ou25 = markets.overUnder.find((l) => l.line === 2.5)!;
  const headlinePicks: HeadlinePick[] = [
    { market: "Gagnant probable", pick: winner.label, prob: winner.probability },
    {
      market: "Score exact",
      pick: `${markets.mostLikelyScore.home}–${markets.mostLikelyScore.away}`,
      prob: markets.mostLikelyScore.prob,
    },
    {
      market: "Total buts",
      pick: ou25.over >= ou25.under ? "+2,5 buts" : "−2,5 buts",
      prob: Math.max(ou25.over, ou25.under),
    },
    {
      market: "Les deux marquent",
      pick: markets.btts.yes >= markets.btts.no ? "Oui" : "Non",
      prob: Math.max(markets.btts.yes, markets.btts.no),
    },
  ];
  const modelSignals = buildSignals({
    home,
    away,
    homeRecent,
    awayRecent,
    winner,
    hasOdds,
    marketWeight,
    xgEdge: lambdaHome - lambdaAway,
  });

  // Grille 6×6 pour l'affichage (au-delà, négligeable).
  const scoreGrid = matrix.slice(0, 6).map((row) => row.slice(0, 6));

  return {
    home: home.team,
    away: away.team,
    winner,
    expectedGoals: {
      home: Math.round(lambdaHome * 100) / 100,
      away: Math.round(lambdaAway * 100) / 100,
      total: Math.round((lambdaHome + lambdaAway) * 100) / 100,
    },
    markets,
    confidence,
    headlinePicks,
    modelSignals,
    scoreGrid,
    meta: {
      hasOdds,
      marketWeight,
      rho: DEFAULT_RHO,
      formAdjusted,
      recentGames: Math.min(homeRecent.played, awayRecent.played),
      dataSignals: [
        "splits domicile/extérieur",
        "forme récente",
        ...(Math.min(homeRecent.played, awayRecent.played) > 0 ? ["derniers matchs détaillés"] : []),
        ...(hasOdds ? ["cotes de marché"] : []),
        "clean sheets / failed-to-score",
      ],
    },
  };
}

// Helper d'affichage : convertit une proba [0,1] en pourcentage à 1 décimale.
export { pct };
