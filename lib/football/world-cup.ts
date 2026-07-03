// Modèle de favoris pour la Coupe du Monde 2026. Sert à la fois à la page
// /app/world-cup (section « Favoris au titre ») et au Coach IA (réponse
// cohérente à « qui va gagner ? »). Les notes de force sont dérivées du niveau
// récent des sélections ; la probabilité de titre est une softmax sur ces notes.

export interface WcContender {
  name: string;
  flag: string;
  rating: number; // force relative (plus haut = plus fort)
}

// Prétendants réalistes au titre (les outsiders lointains sont volontairement
// omis : ils ne pèsent quasi rien dans la proba de titre).
export const WC_CONTENDERS: WcContender[] = [
  { name: "Espagne", flag: "🇪🇸", rating: 91 },
  { name: "France", flag: "🇫🇷", rating: 90 },
  { name: "Argentine", flag: "🇦🇷", rating: 89 },
  { name: "Angleterre", flag: "🏴", rating: 88 },
  { name: "Brésil", flag: "🇧🇷", rating: 87 },
  { name: "Portugal", flag: "🇵🇹", rating: 86 },
  { name: "Pays-Bas", flag: "🇳🇱", rating: 84 },
  { name: "Allemagne", flag: "🇩🇪", rating: 83 },
  { name: "Belgique", flag: "🇧🇪", rating: 81 },
  { name: "Croatie", flag: "🇭🇷", rating: 79 },
  { name: "Maroc", flag: "🇲🇦", rating: 79 },
  { name: "Uruguay", flag: "🇺🇾", rating: 78 },
  { name: "Colombie", flag: "🇨🇴", rating: 77 },
  { name: "Suisse", flag: "🇨🇭", rating: 76 },
  { name: "Danemark", flag: "🇩🇰", rating: 76 },
  { name: "Sénégal", flag: "🇸🇳", rating: 75 },
  { name: "Japon", flag: "🇯🇵", rating: 75 },
  { name: "États-Unis", flag: "🇺🇸", rating: 74 },
  { name: "Norvège", flag: "🇳🇴", rating: 74 },
  { name: "Mexique", flag: "🇲🇽", rating: 73 },
  { name: "Équateur", flag: "🇪🇨", rating: 72 },
  { name: "Corée du Sud", flag: "🇰🇷", rating: 72 },
  { name: "Turquie", flag: "🇹🇷", rating: 72 },
  { name: "Côte d'Ivoire", flag: "🇨🇮", rating: 71 },
];

export interface WcFavorite {
  name: string;
  flag: string;
  prob: number; // probabilité de titre (0..1)
}

// Probabilité de titre = softmax des notes de force (température T : plus T est
// bas, plus l'écart entre favoris et outsiders est marqué).
export function worldCupFavorites(limit = 8): WcFavorite[] {
  const T = 6;
  const weighted = WC_CONTENDERS.map((t) => ({ ...t, e: Math.exp(t.rating / T) }));
  const sum = weighted.reduce((acc, t) => acc + t.e, 0) || 1;
  return weighted
    .map((t) => ({ name: t.name, flag: t.flag, prob: t.e / sum }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, limit);
}
