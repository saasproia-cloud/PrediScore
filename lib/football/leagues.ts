// Catalogue des compétitions. Les `id` sont les IDs réels d'API-Football : dès
// que la clé est posée, ce catalogue pilote directement les appels live.
// Les logos viennent du CDN public d'API-Football (accessibles sans clé).

import type { League } from "@/types/football";

const TEAM_CDN = "https://media.api-sports.io/football/teams";
const LEAGUE_CDN = "https://media.api-sports.io/football/leagues";

export function teamLogo(id: number): string {
  return `${TEAM_CDN}/${id}.png`;
}
export function leagueLogo(id: number): string {
  return `${LEAGUE_CDN}/${id}.png`;
}

// Saison en cours (année de DÉBUT de saison) — 2025 = saison 2025/2026.
// À ajuster selon la couverture de ton plan API-Football.
export const CURRENT_SEASON = 2025;

// Repères de buts par ligue (moyennes dom/ext approximatives) — affine le modèle
// championnat par championnat. Remplacés par les vraies moyennes via standings
// quand l'API est branchée.
const baselines: Record<number, { homeGoals: number; awayGoals: number }> = {
  39: { homeGoals: 1.55, awayGoals: 1.25 }, // Premier League
  140: { homeGoals: 1.5, awayGoals: 1.15 }, // La Liga
  61: { homeGoals: 1.5, awayGoals: 1.2 }, // Ligue 1
  135: { homeGoals: 1.5, awayGoals: 1.15 }, // Serie A
  78: { homeGoals: 1.6, awayGoals: 1.35 }, // Bundesliga
};

export const LEAGUES: League[] = [
  { id: 1, name: "Coupe du Monde 2026", country: "Monde", kind: "cup", season: 2026, logo: leagueLogo(1), flag: "🌍" },
  { id: 2, name: "UEFA Champions League", country: "Europe", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(2), flag: "🇪🇺" },
  { id: 3, name: "UEFA Europa League", country: "Europe", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(3), flag: "🇪🇺" },
  { id: 848, name: "UEFA Conference League", country: "Europe", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(848), flag: "🇪🇺" },
  { id: 45, name: "FA Cup", country: "Angleterre", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(45), flag: "🏴" },
  { id: 48, name: "EFL Cup", country: "Angleterre", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(48), flag: "🏴" },
  { id: 143, name: "Copa del Rey", country: "Espagne", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(143), flag: "🇪🇸" },
  { id: 137, name: "Coppa Italia", country: "Italie", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(137), flag: "🇮🇹" },
  { id: 81, name: "DFB Pokal", country: "Allemagne", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(81), flag: "🇩🇪" },
  { id: 66, name: "Coupe de France", country: "France", kind: "cup", season: CURRENT_SEASON, logo: leagueLogo(66), flag: "🇫🇷" },
  { id: 39, name: "Premier League", country: "Angleterre", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(39), flag: "🏴", baseline: baselines[39] },
  { id: 40, name: "Championship", country: "Angleterre", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(40), flag: "🏴" },
  { id: 140, name: "La Liga", country: "Espagne", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(140), flag: "🇪🇸", baseline: baselines[140] },
  { id: 141, name: "La Liga 2", country: "Espagne", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(141), flag: "🇪🇸" },
  { id: 61, name: "Ligue 1", country: "France", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(61), flag: "🇫🇷", baseline: baselines[61] },
  { id: 62, name: "Ligue 2", country: "France", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(62), flag: "🇫🇷" },
  { id: 135, name: "Serie A", country: "Italie", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(135), flag: "🇮🇹", baseline: baselines[135] },
  { id: 136, name: "Serie B", country: "Italie", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(136), flag: "🇮🇹" },
  { id: 78, name: "Bundesliga", country: "Allemagne", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(78), flag: "🇩🇪", baseline: baselines[78] },
  { id: 79, name: "2. Bundesliga", country: "Allemagne", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(79), flag: "🇩🇪" },
  { id: 88, name: "Eredivisie", country: "Pays-Bas", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(88), flag: "🇳🇱" },
  { id: 94, name: "Primeira Liga", country: "Portugal", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(94), flag: "🇵🇹" },
  { id: 144, name: "Jupiler Pro League", country: "Belgique", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(144), flag: "🇧🇪" },
  { id: 200, name: "Botola Pro", country: "Maroc", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(200), flag: "🇲🇦" },
  { id: 203, name: "Süper Lig", country: "Turquie", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(203), flag: "🇹🇷" },
  { id: 179, name: "Scottish Premiership", country: "Écosse", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(179), flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: 119, name: "Danish Superliga", country: "Danemark", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(119), flag: "🇩🇰" },
  { id: 103, name: "Eliteserien", country: "Norvège", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(103), flag: "🇳🇴" },
  { id: 113, name: "Allsvenskan", country: "Suède", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(113), flag: "🇸🇪" },
  { id: 106, name: "Ekstraklasa", country: "Pologne", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(106), flag: "🇵🇱" },
  { id: 253, name: "MLS", country: "USA", kind: "league", season: 2026, logo: leagueLogo(253), flag: "🇺🇸" },
  { id: 71, name: "Brasileirão Serie A", country: "Brésil", kind: "league", season: 2026, logo: leagueLogo(71), flag: "🇧🇷" },
  { id: 128, name: "Liga Profesional", country: "Argentine", kind: "league", season: 2026, logo: leagueLogo(128), flag: "🇦🇷" },
  { id: 262, name: "Liga MX", country: "Mexique", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(262), flag: "🇲🇽" },
  { id: 307, name: "Saudi Pro League", country: "Arabie saoudite", kind: "league", season: CURRENT_SEASON, logo: leagueLogo(307), flag: "🇸🇦" },
];

export function getLeague(id: number): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

export function leagueBaseline(id?: number) {
  return (id && baselines[id]) || undefined;
}
