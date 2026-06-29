// Indice de confiance — basé sur la QUALITÉ DES DONNÉES, pas sur une fausse
// promesse de précision. C'est notre réponse honnête au « 92% » marketing des
// concurrents : on dit franchement à quel point on fait confiance à l'analyse.

export type ConfidenceLabel = "Faible" | "Moyenne" | "Élevée" | "Très élevée";

export interface ConfidenceInput {
  /** Matchs joués par l'équipe à domicile (taille d'échantillon). */
  homeGames: number;
  /** Matchs joués par l'équipe à l'extérieur. */
  awayGames: number;
  /** Les deux équipes ont-elles une forme récente connue ? */
  hasForm: boolean;
  /** Les deux équipes ont-elles des splits domicile/extérieur exploitables ? */
  hasSplits: boolean;
  /** Des cotes de bookmakers étaient-elles disponibles ? */
  hasOdds: boolean;
  /** Accord modèle ↔ marché ∈ [0,1] (si cotes dispo). */
  modelMarketAgreement?: number;
  /** Nombre de matchs récents réellement détaillés disponibles. */
  recentGames?: number;
  /** Probabilité du résultat le plus probable. */
  favoriteProbability?: number;
  /** Écart entre le premier et le deuxième résultat probable. */
  favoriteGap?: number;
}

export interface Confidence {
  /** Score 0–100. */
  score: number;
  label: ConfidenceLabel;
  reasons: string[];
}

export function computeConfidence(input: ConfidenceInput): Confidence {
  const reasons: string[] = [];
  let score = 0;

  // 1) Taille d'échantillon (max 32 pts) — on prend le plus petit des deux.
  const minGames = Math.min(input.homeGames, input.awayGames);
  score += Math.round(32 * Math.min(1, minGames / 12));
  if (minGames >= 10) reasons.push(`Historique solide (${minGames}+ matchs par équipe)`);
  else if (minGames >= 5) reasons.push(`Échantillon correct (${minGames} matchs par équipe)`);
  else reasons.push(`Peu de matchs disponibles (${minGames}) — prudence`);

  // 2) Splits domicile/extérieur (max 12 pts) — vrai signal de contexte.
  if (input.hasSplits) {
    score += 12;
    reasons.push("Performances domicile/extérieur prises en compte");
  }

  // 3) Forme récente (max 10 pts).
  if (input.hasForm) {
    score += 10;
    reasons.push("Forme récente intégrée");
  }

  // 4) Matchs récents détaillés (max 10 pts) — buts, clean sheets, dynamique.
  const recentGames = input.recentGames ?? 0;
  if (recentGames > 0) {
    score += Math.round(10 * Math.min(1, recentGames / 8));
    reasons.push(`${recentGames} matchs récents détaillés intégrés`);
  }

  // 5) Cotes du marché (max 14 pts) — signal fort si disponible.
  if (input.hasOdds) {
    score += 14;
    reasons.push("Cotes du marché intégrées au calcul");
  } else {
    reasons.push("Pas de cotes de marché (modèle statistique seul)");
  }

  // 6) Accord modèle ↔ marché (max 12 pts).
  if (input.hasOdds && input.modelMarketAgreement != null) {
    score += Math.round(12 * input.modelMarketAgreement);
    if (input.modelMarketAgreement >= 0.8)
      reasons.push("Notre modèle et le marché sont alignés");
    else if (input.modelMarketAgreement >= 0.55)
      reasons.push("Léger écart entre modèle et marché");
    else reasons.push("Modèle et marché divergent — match incertain");
  }

  // 7) Clarté du favori (max 10 pts). Un 42/31 n'a pas la même fiabilité
  // qu'un 58/21, même si les données sont bonnes.
  if (input.favoriteProbability != null && input.favoriteGap != null) {
    const clarity =
      Math.min(1, input.favoriteProbability / 0.62) * 0.55 +
      Math.min(1, input.favoriteGap / 0.22) * 0.45;
    score += Math.round(10 * clarity);
    if (input.favoriteGap >= 0.18) reasons.push("Favori nettement détaché");
    else if (input.favoriteGap >= 0.08) reasons.push("Favori léger, match encore ouvert");
    else reasons.push("Écart très serré entre les issues");
  }

  score = Math.min(100, Math.max(0, score));

  let label: ConfidenceLabel;
  if (score >= 82) label = "Très élevée";
  else if (score >= 64) label = "Élevée";
  else if (score >= 42) label = "Moyenne";
  else label = "Faible";

  return { score, label, reasons };
}
