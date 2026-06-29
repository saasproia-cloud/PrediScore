// Types métier football — partagés entre la couche données (API-Football /
// dataset démo), le moteur de prédiction et l'UI.

export interface TeamRef {
  id: number;
  name: string;
  logo?: string;
  country?: string;
}

export interface TeamSplitStats {
  played: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface RecentMatch {
  opponent: string;
  opponentLogo?: string;
  homeAway: "H" | "A";
  goalsFor: number;
  goalsAgainst: number;
  result: "W" | "D" | "L";
  date?: string;
}

export interface TeamStats {
  team: TeamRef;
  leagueId?: number;
  leagueName?: string;
  season?: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets?: number;
  failedToScore?: number;
  home: TeamSplitStats;
  away: TeamSplitStats;
  /** Forme récente, du plus ancien au plus récent, ex. "WWDLW". */
  form: string;
  lastMatches?: RecentMatch[];
}

export interface DecimalOdds {
  home: number;
  draw: number;
  away: number;
}

export type LeagueKind = "league" | "cup";

export interface League {
  id: number;
  name: string;
  country: string;
  kind: LeagueKind;
  season: number;
  logo?: string;
  flag?: string;
  /** Repère de buts de la ligue (moyennes dom/ext) si connu. */
  baseline?: { homeGoals: number; awayGoals: number };
}

export interface StandingRow {
  rank: number;
  team: TeamRef;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form?: string;
}

export interface Fixture {
  id: number;
  leagueId: number;
  leagueName?: string;
  season?: number;
  date: string;
  status: "scheduled" | "live" | "finished";
  home: TeamRef;
  away: TeamRef;
  goalsHome?: number;
  goalsAway?: number;
}

export interface PlayerStat {
  id: number;
  name: string;
  photo?: string;
  team: TeamRef;
  goals: number;
  assists?: number;
  appearances?: number;
}
