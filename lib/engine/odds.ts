// Cotes des bookmakers → probabilités. Le marché est le signal le plus fort
// du foot : on « dé-vig » (on retire la marge du book) puis on mélange avec
// notre modèle pour caler la calibration.

export interface DecimalOdds {
  home: number;
  draw: number;
  away: number;
}

export interface Outcome {
  home: number;
  draw: number;
  away: number;
}

/** Probabilités implicites brutes (somme > 1 à cause de la marge du book). */
export function impliedProbs(odds: DecimalOdds): Outcome {
  return { home: 1 / odds.home, draw: 1 / odds.draw, away: 1 / odds.away };
}

/** Retire la marge (overround) → vraies probabilités du marché (somme = 1). */
export function deVig(odds: DecimalOdds): Outcome {
  const imp = impliedProbs(odds);
  const overround = imp.home + imp.draw + imp.away;
  if (overround <= 0) return { home: 1 / 3, draw: 1 / 3, away: 1 / 3 };
  return {
    home: imp.home / overround,
    draw: imp.draw / overround,
    away: imp.away / overround,
  };
}

/**
 * Mélange modèle ↔ marché. `marketWeight` ∈ [0,1] : poids accordé au marché.
 * Renormalise pour garantir une somme de 1.
 */
export function blendOutcome(
  model: Outcome,
  market: Outcome,
  marketWeight: number,
): Outcome {
  const w = Math.min(1, Math.max(0, marketWeight));
  const home = model.home * (1 - w) + market.home * w;
  const draw = model.draw * (1 - w) + market.draw * w;
  const away = model.away * (1 - w) + market.away * w;
  const sum = home + draw + away || 1;
  return { home: home / sum, draw: draw / sum, away: away / sum };
}

/** Accord modèle ↔ marché ∈ [0,1] (1 = identiques). Sert au score de confiance. */
export function agreement(model: Outcome, market: Outcome): number {
  const dist =
    Math.abs(model.home - market.home) +
    Math.abs(model.draw - market.draw) +
    Math.abs(model.away - market.away);
  // distance L1 ∈ [0,2] → accord ∈ [0,1]
  return Math.max(0, 1 - dist / 2);
}
