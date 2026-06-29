// Dataset de démonstration — équipes réelles avec des stats de saison réalistes
// (splits domicile/extérieur + forme). Sert UNIQUEMENT de repli quand la clé
// API-Football n'est pas posée : ça permet de voir le vrai moteur tourner en
// preview. Dès que `API_FOOTBALL_KEY` existe, le provider bascule en live.

import type { TeamStats } from "@/types/football";
import { teamLogo } from "./leagues";

type Split = [played: number, goalsFor: number, goalsAgainst: number];

function t(
  id: number,
  name: string,
  leagueId: number,
  home: Split,
  away: Split,
  form: string,
): TeamStats {
  const [hp, hgf, hga] = home;
  const [ap, agf, aga] = away;
  // W/D/L approximés depuis la forme (suffisant pour l'affichage équipe).
  const games = form.replace(/[^WDL]/gi, "").toUpperCase();
  const ratio = games.length || 1;
  const played = hp + ap;
  const wins = Math.round((games.split("W").length - 1) / ratio * played);
  const draws = Math.round((games.split("D").length - 1) / ratio * played);
  return {
    team: { id, name, logo: teamLogo(id) },
    leagueId,
    season: 2024,
    played,
    wins,
    draws,
    losses: Math.max(0, played - wins - draws),
    goalsFor: hgf + agf,
    goalsAgainst: hga + aga,
    home: { played: hp, goalsFor: hgf, goalsAgainst: hga },
    away: { played: ap, goalsFor: agf, goalsAgainst: aga },
    form,
  };
}

export const DEMO_TEAMS: TeamStats[] = [
  // Premier League (39)
  t(50, "Manchester City", 39, [19, 51, 16], [19, 45, 18], "WWWDW"),
  t(42, "Arsenal", 39, [19, 49, 13], [19, 42, 16], "WWDWW"),
  t(40, "Liverpool", 39, [19, 47, 13], [19, 39, 28], "WDWWL"),
  t(34, "Newcastle", 39, [19, 47, 27], [19, 38, 35], "WWLWD"),
  t(66, "Aston Villa", 39, [19, 43, 24], [19, 33, 37], "WLWDL"),
  t(47, "Tottenham", 39, [19, 42, 28], [19, 32, 33], "WLWLW"),
  t(49, "Chelsea", 39, [19, 38, 26], [19, 39, 37], "WWDWL"),
  t(33, "Manchester United", 39, [19, 31, 28], [19, 26, 30], "LWLDW"),
  t(1359, "Luton Town", 39, [19, 28, 38], [19, 24, 47], "LLDLL"),

  // La Liga (140)
  t(541, "Real Madrid", 140, [19, 49, 12], [19, 38, 14], "WWWDW"),
  t(529, "Barcelona", 140, [19, 44, 22], [19, 35, 22], "WWLWD"),
  t(530, "Atlético Madrid", 140, [19, 41, 15], [19, 29, 28], "WDWLW"),
  t(547, "Girona", 140, [19, 45, 24], [19, 40, 22], "WWLWW"),

  // Ligue 1 (61)
  t(85, "Paris Saint-Germain", 61, [17, 47, 16], [17, 34, 17], "WWDWW"),
  t(91, "Monaco", 61, [17, 36, 20], [17, 32, 22], "WLWDW"),
  t(116, "Lens", 61, [17, 27, 17], [17, 21, 22], "DWLDL"),
  t(81, "Marseille", 61, [17, 30, 17], [17, 21, 24], "DLWDW"),
  t(106, "Brest", 61, [17, 27, 18], [17, 26, 21], "WDWLW"),

  // Serie A (135)
  t(505, "Inter", 135, [19, 50, 9], [19, 39, 13], "WWWDW"),
  t(489, "AC Milan", 135, [19, 39, 23], [19, 37, 26], "WWLWL"),
  t(496, "Juventus", 135, [19, 30, 14], [19, 24, 17], "DDWLD"),
  t(492, "Napoli", 135, [19, 32, 22], [19, 23, 26], "LWDWL"),

  // Bundesliga (78)
  t(168, "Bayer Leverkusen", 78, [17, 48, 12], [17, 41, 12], "WWWWD"),
  t(157, "Bayern München", 78, [17, 50, 18], [17, 44, 27], "WWDLW"),
  t(165, "Borussia Dortmund", 78, [17, 39, 21], [17, 29, 22], "WDLWW"),
  t(173, "RB Leipzig", 78, [17, 41, 18], [17, 36, 21], "WWDLW"),
];

export function findDemoTeam(query: string): TeamStats | undefined {
  const q = query.trim().toLowerCase();
  return (
    DEMO_TEAMS.find((t) => t.team.name.toLowerCase() === q) ||
    DEMO_TEAMS.find((t) => t.team.name.toLowerCase().includes(q))
  );
}

export function searchDemoTeams(query: string, limit = 8): TeamStats[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_TEAMS.slice(0, limit);
  return DEMO_TEAMS.filter((t) => t.team.name.toLowerCase().includes(q)).slice(0, limit);
}

export function demoTeamById(id: number): TeamStats | undefined {
  return DEMO_TEAMS.find((t) => t.team.id === id);
}
