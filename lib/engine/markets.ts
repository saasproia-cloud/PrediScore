// Dérive TOUS les marchés à partir de la grille des scores normalisée.
// Chaque probabilité est une vraie somme de cases de la grille — rien d'inventé.

export interface CorrectScore {
  home: number;
  away: number;
  prob: number;
}

export interface OverUnder {
  line: number;
  over: number;
  under: number;
}

export interface MatchMarkets {
  /** 1-N-2 : probabilités victoire dom / nul / victoire ext. */
  outcome: { home: number; draw: number; away: number };
  doubleChance: { homeOrDraw: number; awayOrDraw: number; homeOrAway: number };
  /** Lignes over/under (1.5, 2.5, 3.5). */
  overUnder: OverUnder[];
  btts: { yes: number; no: number };
  /** Scores exacts les plus probables (triés décroissant). */
  correctScores: CorrectScore[];
  mostLikelyScore: CorrectScore;
  cleanSheet: { home: number; away: number };
  winToNil: { home: number; away: number };
  /** Tranches de nombre de buts total. */
  goalsBands: { label: string; prob: number }[];
}

const OU_LINES = [1.5, 2.5, 3.5];

export function computeMarkets(matrix: number[][]): MatchMarkets {
  const n = matrix.length;

  let home = 0;
  let draw = 0;
  let away = 0;
  let bttsYes = 0;
  let cleanSheetHome = 0; // l'extérieur ne marque pas
  let cleanSheetAway = 0; // le domicile ne marque pas
  let winToNilHome = 0;
  let winToNilAway = 0;

  const overCounts = OU_LINES.map(() => 0);
  let band01 = 0;
  let band23 = 0;
  let band4plus = 0;

  const scores: CorrectScore[] = [];

  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      const p = matrix[x][y];
      if (p <= 0) continue;

      // 1-N-2
      if (x > y) home += p;
      else if (x === y) draw += p;
      else away += p;

      // BTTS
      if (x >= 1 && y >= 1) bttsYes += p;

      // Clean sheets / win to nil
      if (y === 0) {
        cleanSheetHome += p;
        if (x > 0) winToNilHome += p;
      }
      if (x === 0) {
        cleanSheetAway += p;
        if (y > 0) winToNilAway += p;
      }

      // Over/Under
      const totalGoals = x + y;
      for (let i = 0; i < OU_LINES.length; i++) {
        if (totalGoals > OU_LINES[i]) overCounts[i] += p;
      }

      // Tranches de buts
      if (totalGoals <= 1) band01 += p;
      else if (totalGoals <= 3) band23 += p;
      else band4plus += p;

      scores.push({ home: x, away: y, prob: p });
    }
  }

  scores.sort((a, b) => b.prob - a.prob);

  return {
    outcome: { home, draw, away },
    doubleChance: {
      homeOrDraw: home + draw,
      awayOrDraw: away + draw,
      homeOrAway: home + away,
    },
    overUnder: OU_LINES.map((line, i) => ({
      line,
      over: overCounts[i],
      under: 1 - overCounts[i],
    })),
    btts: { yes: bttsYes, no: 1 - bttsYes },
    correctScores: scores.slice(0, 8),
    mostLikelyScore: scores[0],
    cleanSheet: { home: cleanSheetHome, away: cleanSheetAway },
    winToNil: { home: winToNilHome, away: winToNilAway },
    goalsBands: [
      { label: "0–1 but", prob: band01 },
      { label: "2–3 buts", prob: band23 },
      { label: "4 buts +", prob: band4plus },
    ],
  };
}
