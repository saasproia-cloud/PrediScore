// Distribution de Poisson — base statistique du moteur de prédiction.
// Fonctions pures, sans effet de bord. Au-delà de ~10 buts la probabilité est
// négligeable au football : on tronque la grille à `maxGoals`.

const LOG_FACT_CACHE: number[] = [0, 0]; // ln(0!) = ln(1!) = 0

// ln(n!) mémoïsé — on travaille en log pour éviter tout débordement sur la
// factorielle, même si ici n reste petit (≤ ~10).
function logFactorial(n: number): number {
  if (n < LOG_FACT_CACHE.length) return LOG_FACT_CACHE[n];
  let value = LOG_FACT_CACHE[LOG_FACT_CACHE.length - 1];
  for (let i = LOG_FACT_CACHE.length; i <= n; i++) {
    value += Math.log(i);
    LOG_FACT_CACHE[i] = value;
  }
  return value;
}

/** Masse de probabilité de Poisson : P(X = k) pour une moyenne `lambda`. */
export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // exp(k·ln(λ) − λ − ln(k!))
  return Math.exp(k * Math.log(lambda) - lambda - logFactorial(k));
}

/** Vecteur [P(0), P(1), …, P(maxGoals)] pour une moyenne donnée. */
export function poissonVector(lambda: number, maxGoals: number): number[] {
  const out: number[] = new Array(maxGoals + 1);
  for (let k = 0; k <= maxGoals; k++) out[k] = poissonPmf(k, lambda);
  return out;
}

/** Borne une valeur dans [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
