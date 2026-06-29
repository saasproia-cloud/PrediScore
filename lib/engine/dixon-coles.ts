// Modèle Dixon-Coles — le cœur des prédictions.
//
// 1. On estime la force d'attaque/défense de chaque équipe (splits domicile /
//    extérieur) par rapport à la moyenne de la ligue → buts attendus (λ).
// 2. On construit la grille complète des scores via deux lois de Poisson.
// 3. On applique la correction Dixon-Coles (τ) qui rééquilibre les petits
//    scores (0-0, 1-0, 0-1, 1-1), point faible du Poisson indépendant.
//
// Tout est déterministe : deux équipes différentes → des chiffres différents.
// Aucun nombre inventé, aucune répétition.

import { poissonVector, clamp } from "./poisson";

export interface TeamSplit {
  /** Matchs joués dans ce contexte (domicile OU extérieur). */
  played: number;
  /** Buts marqués dans ce contexte. */
  goalsFor: number;
  /** Buts encaissés dans ce contexte. */
  goalsAgainst: number;
}

export interface LeagueBaseline {
  /** Buts moyens marqués par l'équipe à DOMICILE par match dans la ligue. */
  homeGoals: number;
  /** Buts moyens marqués par l'équipe à l'EXTÉRIEUR par match dans la ligue. */
  awayGoals: number;
}

// Repère par défaut (grands championnats européens) si la ligue n'expose pas
// ses propres moyennes. ~1,5 but à domicile, ~1,15 à l'extérieur, total ~2,65.
export const DEFAULT_BASELINE: LeagueBaseline = { homeGoals: 1.5, awayGoals: 1.15 };

// Paramètre de dépendance bas-score de Dixon-Coles. ρ négatif relève 0-0 / 1-1
// et abaisse 1-0 / 0-1 — corrige la sous-dispersion connue du Poisson.
export const DEFAULT_RHO = -0.13;

// Force du lissage (shrinkage) : avec peu de matchs, on tire les ratios vers la
// moyenne de la ligue pour éviter les valeurs aberrantes de début de saison.
const SHRINK_GAMES = 6;

// Taux par match lissé vers un a priori (la moyenne de ligue) — bayésien simple.
function shrunkRate(total: number, games: number, prior: number): number {
  return (total + prior * SHRINK_GAMES) / (games + SHRINK_GAMES);
}

export interface ExpectedGoals {
  home: number;
  away: number;
}

/**
 * Buts attendus pour chaque équipe.
 * @param home  split DOMICILE de l'équipe qui reçoit
 * @param away  split EXTÉRIEUR de l'équipe qui se déplace
 */
export function expectedGoals(
  home: TeamSplit,
  away: TeamSplit,
  baseline: LeagueBaseline = DEFAULT_BASELINE,
): ExpectedGoals {
  const muH = baseline.homeGoals;
  const muA = baseline.awayGoals;

  // Force d'attaque/défense relative (1.0 = exactement la moyenne de ligue).
  const homeAttack = shrunkRate(home.goalsFor, home.played, muH) / muH;
  const homeDefense = shrunkRate(home.goalsAgainst, home.played, muA) / muA;
  const awayAttack = shrunkRate(away.goalsFor, away.played, muA) / muA;
  const awayDefense = shrunkRate(away.goalsAgainst, away.played, muH) / muH;

  // λ_dom = attaque_dom × défense_ext × moyenne_buts_dom
  // λ_ext = attaque_ext × défense_dom × moyenne_buts_ext
  const lambdaHome = homeAttack * awayDefense * muH;
  const lambdaAway = awayAttack * homeDefense * muA;

  return {
    home: clamp(lambdaHome, 0.15, 6),
    away: clamp(lambdaAway, 0.15, 6),
  };
}

// Correction Dixon-Coles τ pour les quatre scores bas dépendants.
function tau(x: number, y: number, lambda: number, mu: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lambda * mu * rho;
  if (x === 0 && y === 1) return 1 + lambda * rho;
  if (x === 1 && y === 0) return 1 + mu * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

/**
 * Grille des scores normalisée : `matrix[x][y]` = P(domicile marque x, ext marque y).
 * La somme de toutes les cases vaut 1.
 */
export function scoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  rho: number = DEFAULT_RHO,
  maxGoals = 10,
): number[][] {
  const ph = poissonVector(lambdaHome, maxGoals);
  const pa = poissonVector(lambdaAway, maxGoals);
  const matrix: number[][] = [];
  let total = 0;

  for (let x = 0; x <= maxGoals; x++) {
    matrix[x] = new Array(maxGoals + 1);
    for (let y = 0; y <= maxGoals; y++) {
      const p = tau(x, y, lambdaHome, lambdaAway, rho) * ph[x] * pa[y];
      const safe = p > 0 ? p : 0; // τ peut passer <0 pour ρ extrême → garde-fou.
      matrix[x][y] = safe;
      total += safe;
    }
  }

  // Normalisation (τ + troncature cassent la somme à 1).
  if (total > 0) {
    for (let x = 0; x <= maxGoals; x++)
      for (let y = 0; y <= maxGoals; y++) matrix[x][y] /= total;
  }
  return matrix;
}
