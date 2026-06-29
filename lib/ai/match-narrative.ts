// Narration d'analyse — SERVER ONLY. L'IA reçoit des chiffres DÉJÀ CALCULÉS par
// le moteur statistique et doit seulement les EXPLIQUER. Interdiction absolue
// d'inventer ou de modifier un nombre → c'est ce qui élimine les « chiffres
// faux et répétitifs ». Sans clé OpenAI, un fallback déterministe (lui aussi
// ancré sur les vrais chiffres) prend le relais.

import { chatJSON } from "./openai-client";
import type { MatchPrediction } from "@/lib/engine/predict";
import { pct } from "@/lib/engine/predict";

export interface MatchNarrative {
  /** Scénario du match (2–3 phrases). */
  scenario: string;
  /** 3–4 facteurs clés. */
  keyFactors: string[];
  /** Verdict en une phrase. */
  verdict: string;
  source: "ai" | "model";
}

// Faits compacts injectés dans le prompt — l'IA n'a accès qu'à ça.
function factsForPrompt(p: MatchPrediction): string {
  const o = p.markets.outcome;
  const ou = p.markets.overUnder.find((l) => l.line === 2.5)!;
  const cs = p.markets.correctScores
    .slice(0, 3)
    .map((s) => `${s.home}-${s.away} (${pct(s.prob)}%)`)
    .join(", ");
  return [
    `Domicile: ${p.home.name} | Extérieur: ${p.away.name}`,
    `Pronostic principal: ${p.winner.label} (${pct(p.winner.probability)}%, écart ${pct(p.winner.margin)} pts)`,
    `Victoire ${p.home.name}: ${pct(o.home)}% | Nul: ${pct(o.draw)}% | Victoire ${p.away.name}: ${pct(o.away)}%`,
    `Buts attendus: ${p.home.name} ${p.expectedGoals.home} - ${p.expectedGoals.away} ${p.away.name}`,
    `Scores les plus probables: ${cs}`,
    `+2,5 buts: ${pct(ou.over)}% | Les deux marquent (oui): ${pct(p.markets.btts.yes)}%`,
    `Confiance modèle: ${p.confidence.label} (${p.confidence.score}/100)`,
    `Signaux modèle: ${p.modelSignals.map((s) => `${s.label} — ${s.detail}`).join(" | ")}`,
  ].join("\n");
}

const SYSTEM = `Tu es un analyste football professionnel pour une app de pronostics.
On te fournit des probabilités DÉJÀ CALCULÉES par un modèle statistique (Dixon-Coles).
RÈGLES ABSOLUES :
- Tu n'inventes JAMAIS un chiffre. Tu n'utilises QUE les chiffres fournis.
- Tu ne contredis jamais le modèle (si le modèle donne un favori, tu vas dans ce sens).
- Tu commences par le gagnant probable ou le nul si le modèle place le nul en premier.
- Tu expliques POURQUOI, de façon crédible et concrète (forme, attaque/défense, contexte dom/ext, signaux modèle).
- Style: français, direct, expert, sans jargon de paris, sans promesse de gain.
Réponds UNIQUEMENT en JSON: {"scenario": string (2-3 phrases), "keyFactors": string[] (3 à 4 puces courtes), "verdict": string (1 phrase)}.`;

export async function generateMatchNarrative(
  p: MatchPrediction,
): Promise<MatchNarrative> {
  const user = `Voici les données calculées pour ce match:\n${factsForPrompt(p)}\n\nRédige l'analyse.`;
  const raw = await chatJSON({ system: SYSTEM, user, temperature: 0.6, maxTokens: 700 });
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.scenario && Array.isArray(parsed?.keyFactors)) {
        return {
          scenario: String(parsed.scenario),
          keyFactors: parsed.keyFactors.map(String).slice(0, 4),
          verdict: String(parsed.verdict ?? ""),
          source: "ai",
        };
      }
    } catch {
      // JSON invalide → fallback déterministe.
    }
  }
  return fallbackNarrative(p);
}

// Fallback ancré sur les chiffres (utilisé sans clé OpenAI ou si l'appel échoue).
export function fallbackNarrative(p: MatchPrediction): MatchNarrative {
  const o = p.markets.outcome;
  const ou = p.markets.overUnder.find((l) => l.line === 2.5)!;
  const home = p.home.name;
  const away = p.away.name;

  const ms = p.markets.mostLikelyScore;
  const fav = p.winner.key === "draw" ? null : p.winner.label;
  const favProb = p.winner.probability;

  const scenario = fav
    ? `${fav} part favori de ce match avec ${pct(favProb)}% de probabilité selon notre modèle. ` +
      `Les buts attendus (${p.expectedGoals.home} contre ${p.expectedGoals.away}) pointent vers un ${ms.home}-${ms.away}, ` +
      `le score le plus probable. ${ou.over >= ou.under ? `Le match s'annonce ouvert (+2,5 buts à ${pct(ou.over)}%).` : `Une rencontre fermée se dessine (−2,5 buts à ${pct(ou.under)}%).`}`
    : `Match très serré : aucune équipe ne se détache nettement (${home} ${pct(o.home)}% / nul ${pct(o.draw)}% / ${away} ${pct(o.away)}%). ` +
      `Le score le plus probable reste un ${ms.home}-${ms.away}.`;

  const keyFactors = [
    `Buts attendus : ${home} ${p.expectedGoals.home} — ${p.expectedGoals.away} ${away}`,
    `${p.markets.btts.yes >= p.markets.btts.no ? "Les deux équipes devraient marquer" : "Une équipe pourrait garder sa cage inviolée"} (BTTS oui ${pct(p.markets.btts.yes)}%)`,
    `Total de buts le plus probable : ${ou.over >= ou.under ? "plus" : "moins"} de 2,5`,
    `Confiance du modèle : ${p.confidence.label} (${p.confidence.score}/100)`,
  ];

  const verdict = `Pronostic principal : ${p.winner.label} (${pct(p.winner.probability)}%)`;

  return { scenario, keyFactors, verdict, source: "model" };
}
