// Façade unique de données football. Si `API_FOOTBALL_KEY` est posée → données
// LIVE (API-Football). Sinon → dataset de démonstration. Le reste de l'app
// (routes API, UI) n'appelle QUE ce fichier : on bascule live/démo sans rien
// changer ailleurs.

import type {
  TeamRef,
  TeamStats,
  StandingRow,
  Fixture,
  DecimalOdds,
  PlayerStat,
} from "@/types/football";
import type { FootballDataSource } from "@/types/analysis";
import { CURRENT_SEASON, leagueBaseline, getLeague } from "./leagues";
import {
  DEMO_TEAMS,
  findDemoTeam,
  searchDemoTeams,
  demoTeamById,
} from "./demo-data";
import {
  apiFootballConfigured,
  searchTeamsLive,
  searchTeamsByCountryLive,
  resolveLeagueForTeam,
  getTeamStatsLive,
  getStandingsLive,
  getUpcomingFixturesLive,
  getUpcomingFixturesForTeamLive,
  getFixtureByIdLive,
  getFixtureBetweenLive,
  getRecentFixtureBetweenLive,
  getRecentFixturesForTeamLive,
  getOddsLive,
  getTopScorersLive,
} from "./api-football";

export function isLive(): boolean {
  return apiFootballConfigured();
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const TEAM_ALIASES = [
  ["psg", "paris saint germain"],
  ["paris", "paris saint germain"],
  ["barca", "barcelona"],
  ["barça", "barcelona"],
  ["man city", "manchester city"],
  ["city", "manchester city"],
  ["man utd", "manchester united"],
  ["man united", "manchester united"],
  ["bayern", "bayern munich"],
  ["inter", "inter milan"],
  ["maroc", "morocco"],
  ["angleterre", "england"],
  ["espagne", "spain"],
  ["allemagne", "germany"],
  ["pays bas", "netherlands"],
  ["pays-bas", "netherlands"],
  ["italie", "italy"],
  ["portugal", "portugal"],
  ["norvege", "norway"],
  ["norvège", "norway"],
  ["norway", "norway"],
  ["bresil", "brazil"],
  ["cote divoire", "ivory coast"],
  ["côte d'ivoire", "ivory coast"],
  ["etats unis", "usa"],
  ["etats-unis", "usa"],
] as const;

const COUNTRY_ALIASES = [
  ["france", "France"],
  ["maroc", "Morocco"],
  ["morocco", "Morocco"],
  ["norvege", "Norway"],
  ["norvège", "Norway"],
  ["norway", "Norway"],
  ["angleterre", "England"],
  ["england", "England"],
  ["espagne", "Spain"],
  ["spain", "Spain"],
  ["allemagne", "Germany"],
  ["germany", "Germany"],
  ["pays bas", "Netherlands"],
  ["pays-bas", "Netherlands"],
  ["netherlands", "Netherlands"],
  ["italie", "Italy"],
  ["italy", "Italy"],
  ["portugal", "Portugal"],
  ["bresil", "Brazil"],
  ["brazil", "Brazil"],
  ["argentine", "Argentina"],
  ["argentina", "Argentina"],
  ["belgique", "Belgium"],
  ["belgium", "Belgium"],
  ["croatie", "Croatia"],
  ["croatia", "Croatia"],
  ["suisse", "Switzerland"],
  ["switzerland", "Switzerland"],
  ["usa", "USA"],
  ["etats unis", "USA"],
  ["etats-unis", "USA"],
] as const;

function aliasQueries(query: string): string[] {
  const q = normalizeSearch(query);
  const out = new Set<string>([query]);
  for (const [local, api] of TEAM_ALIASES) {
    const l = normalizeSearch(local);
    const a = normalizeSearch(api);
    if (l.startsWith(q) || q.startsWith(l) || a.startsWith(q) || q.startsWith(a)) {
      out.add(api);
    }
  }
  return Array.from(out).filter(Boolean);
}

function countryQueries(query: string): string[] {
  const q = normalizeSearch(query);
  const out = new Set<string>();
  for (const [local, apiCountry] of COUNTRY_ALIASES) {
    const l = normalizeSearch(local);
    const c = normalizeSearch(apiCountry);
    if (l.startsWith(q) || q.startsWith(l) || c.startsWith(q) || q.startsWith(c)) {
      out.add(apiCountry);
    }
  }
  return Array.from(out);
}

function teamSearchScore(team: TeamRef, query: string): number {
  const q = normalizeSearch(query);
  const name = normalizeSearch(team.name);
  const country = normalizeSearch(team.country ?? "");
  if (!q) return 0;

  let score = 0;
  if (name === q) score = Math.max(score, 130);
  if (name.startsWith(q)) score = Math.max(score, 115);
  if (name.split(/[\s.-]+/).some((part) => part.startsWith(q))) score = Math.max(score, 102);
  if (name.includes(q)) score = Math.max(score, 82);
  if (country.startsWith(q)) score = Math.max(score, 68);
  if (country.includes(q)) score = Math.max(score, 48);

  for (const [local, api] of TEAM_ALIASES) {
    const l = normalizeSearch(local);
    const a = normalizeSearch(api);
    if ((l.startsWith(q) || q.startsWith(l)) && (name === a || country === a)) {
      score = Math.max(score, 150);
    }
  }

  for (const [local, apiCountry] of COUNTRY_ALIASES) {
    const l = normalizeSearch(local);
    const c = normalizeSearch(apiCountry);
    if ((l.startsWith(q) || q.startsWith(l) || c.startsWith(q) || q.startsWith(c)) && name === c) {
      score = Math.max(score, 170);
    }
  }

  return score;
}

function rankTeams(teams: TeamRef[], query: string): TeamRef[] {
  const seen = new Set<number>();
  return teams
    .map((team, index) => ({ team, index, score: teamSearchScore(team, query) }))
    .filter(({ team, score }) => {
      if (seen.has(team.id) || score <= 0) return false;
      seen.add(team.id);
      return true;
    })
    .sort((a, b) => b.score - a.score || a.index - b.index || a.team.name.localeCompare(b.team.name))
    .slice(0, 10)
    .map(({ team }) => team);
}

async function searchLiveTeamsEnhanced(query: string): Promise<TeamRef[]> {
  const searches = aliasQueries(query);
  const countrySearches = countryQueries(query);
  const [teamResults, countryResults] = await Promise.all([
    Promise.all(searches.map((term) => searchTeamsLive(term))),
    Promise.all(countrySearches.map((country) => searchTeamsByCountryLive(country))),
  ]);
  return rankTeams([...teamResults.flat(), ...countryResults.flat()], query);
}

export async function searchTeams(query: string): Promise<TeamRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (isLive()) {
    const ranked = await searchLiveTeamsEnhanced(q);
    if (ranked.length) return ranked;
  }
  return rankTeams(searchDemoTeams(q).map((t) => t.team), q);
}

interface ResolvedTeam {
  stats: TeamStats;
  source: FootballDataSource;
}

interface ResolvedTeamRef {
  team: TeamRef;
  source: FootballDataSource;
}

export type FixtureSearchMode = "direct" | "team-upcoming" | "mixed";

export interface FixtureSearchResult {
  fixtures: Fixture[];
  mode: FixtureSearchMode;
  source: FootballDataSource;
}

async function resolveTeamRefWithSource(idOrName: string | number): Promise<ResolvedTeamRef | null> {
  if (isLive()) {
    if (typeof idOrName === "number" || /^\d+$/.test(String(idOrName))) {
      return { team: { id: Number(idOrName), name: String(idOrName) }, source: "live" };
    }
    const found = await searchLiveTeamsEnhanced(String(idOrName));
    if (found[0]) return { team: found[0], source: "live" };
  }
  const demo =
    typeof idOrName === "number" || /^\d+$/.test(String(idOrName))
      ? demoTeamById(Number(idOrName)) ?? null
      : findDemoTeam(String(idOrName)) ?? null;
  if (!demo) return null;
  return { team: demo.team, source: isLive() ? "fallback" : "demo" };
}

export async function resolveTeamRef(idOrName: string | number): Promise<TeamRef | null> {
  return (await resolveTeamRefWithSource(idOrName))?.team ?? null;
}

/** Résout une équipe (par id numérique OU par nom) vers ses stats complètes. */
async function resolveTeamWithSource(idOrName: string | number): Promise<ResolvedTeam | null> {
  if (isLive()) {
    let ref: TeamRef | undefined;
    if (typeof idOrName === "number" || /^\d+$/.test(String(idOrName))) {
      ref = { id: Number(idOrName), name: String(idOrName) };
    } else {
      const found = await searchLiveTeamsEnhanced(String(idOrName));
      ref = found[0];
    }
    if (ref) {
      const leagueId = await resolveLeagueForTeam(ref.id, CURRENT_SEASON);
      if (leagueId) {
        const stats = await getTeamStatsLive(ref.id, leagueId, CURRENT_SEASON);
        if (stats) return { stats: await enrichLiveTeamStats(stats), source: "live" };
      }
    }
    // pas de stats live → repli démo si l'équipe y existe.
  }
  const demo =
    typeof idOrName === "number" || /^\d+$/.test(String(idOrName))
      ? demoTeamById(Number(idOrName)) ?? null
      : findDemoTeam(String(idOrName)) ?? null;
  if (!demo) return null;
  return { stats: demo, source: isLive() ? "fallback" : "demo" };
}

export async function resolveTeam(idOrName: string | number): Promise<TeamStats | null> {
  return (await resolveTeamWithSource(idOrName))?.stats ?? null;
}

export interface MatchContext {
  home: TeamStats;
  away: TeamStats;
  fixture?: Fixture;
  baseline?: { homeGoals: number; awayGoals: number };
  odds: DecimalOdds | null;
  leagueId?: number;
  fixtureId?: number;
  live: boolean;
  source: FootballDataSource;
}

function uniqueFixtures(fixtures: Fixture[]): Fixture[] {
  const seen = new Set<number>();
  return fixtures.filter((fixture) => {
    if (seen.has(fixture.id)) return false;
    seen.add(fixture.id);
    return true;
  });
}

function fixtureMatchesPair(fixture: Fixture, a: TeamRef, b: TeamRef): boolean {
  const ids = new Set([a.id, b.id]);
  return ids.has(fixture.home.id) && ids.has(fixture.away.id);
}

function demoFixturesForTeam(teamId: number): Fixture[] {
  const team = DEMO_TEAMS.find((t) => t.team.id === teamId);
  if (!team?.leagueId) return [];
  return demoFixtures(team.leagueId).filter(
    (fixture) => fixture.home.id === teamId || fixture.away.id === teamId,
  );
}

function demoFixtureById(fixtureId: number): Fixture | null {
  const leagueIds = Array.from(
    new Set(DEMO_TEAMS.map((t) => t.leagueId).filter(Boolean) as number[]),
  );
  for (const leagueId of leagueIds) {
    const fixture = demoFixtures(leagueId).find((fx) => fx.id === fixtureId);
    if (fixture) return fixture;
  }
  return null;
}

async function enrichLiveTeamStats(stats: TeamStats): Promise<TeamStats> {
  if (!isLive() || stats.team.id <= 0) return stats;
  const lastMatches = await getRecentFixturesForTeamLive(stats.team.id, 8);
  if (!lastMatches.length) return stats;
  return {
    ...stats,
    lastMatches,
    form: lastMatches.map((m) => m.result).join("").slice(-6) || stats.form,
  };
}

export async function searchFixturesForTeams(params: {
  team?: string | number;
  home?: string | number;
  away?: string | number;
}): Promise<FixtureSearchResult> {
  const { team, home, away } = params;

  if (home && away) {
    const [homeRef, awayRef] = await Promise.all([
      resolveTeamRefWithSource(home),
      resolveTeamRefWithSource(away),
    ]);
    if (!homeRef || !awayRef) {
      return { fixtures: [], mode: "mixed", source: isLive() ? "fallback" : "demo" };
    }

    if (isLive() && homeRef.source === "live" && awayRef.source === "live") {
      const [direct, recentDirect, homeUpcoming, awayUpcoming] = await Promise.all([
        getFixtureBetweenLive(homeRef.team.id, awayRef.team.id),
        getRecentFixtureBetweenLive(homeRef.team.id, awayRef.team.id),
        getUpcomingFixturesForTeamLive(homeRef.team.id, 8),
        getUpcomingFixturesForTeamLive(awayRef.team.id, 8),
      ]);
      const indirect = uniqueFixtures([...homeUpcoming, ...awayUpcoming]).filter(
        (fixture) => !direct || !fixtureMatchesPair(fixture, homeRef.team, awayRef.team),
      );
      const exact = direct ?? recentDirect;
      return {
        fixtures: uniqueFixtures([...(exact ? [exact] : []), ...indirect]).slice(0, 12),
        mode: exact ? "direct" : "mixed",
        source: "live",
      };
    }

    const homeDemo = demoFixturesForTeam(homeRef.team.id);
    const awayDemo = demoFixturesForTeam(awayRef.team.id);
    const direct = [...homeDemo, ...awayDemo].find((fixture) =>
      fixtureMatchesPair(fixture, homeRef.team, awayRef.team),
    );
    return {
      fixtures: uniqueFixtures([...(direct ? [direct] : []), ...homeDemo, ...awayDemo]).slice(0, 12),
      mode: direct ? "direct" : "mixed",
      source: isLive() ? "fallback" : "demo",
    };
  }

  const target = team ?? home ?? away;
  if (!target) return { fixtures: [], mode: "team-upcoming", source: isLive() ? "live" : "demo" };
  const ref = await resolveTeamRefWithSource(target);
  if (!ref) return { fixtures: [], mode: "team-upcoming", source: isLive() ? "fallback" : "demo" };

  if (isLive() && ref.source === "live") {
    return {
      fixtures: await getUpcomingFixturesForTeamLive(ref.team.id, 12),
      mode: "team-upcoming",
      source: "live",
    };
  }

  return {
    fixtures: demoFixturesForTeam(ref.team.id).slice(0, 12),
    mode: "team-upcoming",
    source: isLive() ? "fallback" : "demo",
  };
}

async function statsForFixtureTeam(team: TeamRef, fixture: Fixture): Promise<TeamStats | null> {
  const season = fixture.season ?? CURRENT_SEASON;
  if (isLive()) {
    const direct = await getTeamStatsLive(team.id, fixture.leagueId, season);
    if (direct) return enrichLiveTeamStats(direct);

    const leagueId = await resolveLeagueForTeam(team.id, season);
    if (leagueId) {
      const fallback = await getTeamStatsLive(team.id, leagueId, season);
      if (fallback) return enrichLiveTeamStats(fallback);
    }
  }
  return demoTeamById(team.id) ?? null;
}

export async function getMatchContextByFixture(
  fixtureId: string | number,
): Promise<MatchContext | null> {
  const id = Number(fixtureId);
  if (!Number.isFinite(id)) return null;

  if (isLive()) {
    const fixture = await getFixtureByIdLive(id);
    if (fixture) {
      const [home, away, odds] = await Promise.all([
        statsForFixtureTeam(fixture.home, fixture),
        statsForFixtureTeam(fixture.away, fixture),
        getOddsLive(fixture.id),
      ]);
      if (!home || !away) return null;
      return {
        home,
        away,
        fixture,
        baseline: leagueBaseline(fixture.leagueId),
        odds,
        leagueId: fixture.leagueId,
        fixtureId: fixture.id,
        live: true,
        source: "live",
      };
    }
  }

  const demo = demoFixtureById(id);
  if (!demo) return null;
  const home = demoTeamById(demo.home.id);
  const away = demoTeamById(demo.away.id);
  if (!home || !away) return null;
  const source: FootballDataSource = isLive() ? "fallback" : "demo";
  return {
    home,
    away,
    fixture: demo,
    baseline: leagueBaseline(demo.leagueId),
    odds: null,
    leagueId: demo.leagueId,
    fixtureId: demo.id,
    live: false,
    source,
  };
}

/** Rassemble tout ce dont le moteur a besoin pour un match donné. */
export async function getMatchContext(
  homeQuery: string | number,
  awayQuery: string | number,
): Promise<MatchContext | null> {
  const [homeResolved, awayResolved] = await Promise.all([
    resolveTeamWithSource(homeQuery),
    resolveTeamWithSource(awayQuery),
  ]);
  const home = homeResolved?.stats;
  const away = awayResolved?.stats;
  if (!home || !away) return null;

  const leagueId = home.leagueId ?? away.leagueId;
  const baseline = leagueBaseline(leagueId);
  const source: FootballDataSource =
    homeResolved.source === "live" && awayResolved.source === "live"
      ? "live"
      : isLive()
        ? "fallback"
        : "demo";

  let odds: DecimalOdds | null = null;
  let fixtureId: number | undefined;
  if (isLive()) {
    const fixture = await getFixtureBetweenLive(home.team.id, away.team.id);
    if (fixture) {
      fixtureId = fixture.id;
      odds = await getOddsLive(fixture.id);
    }
  }

  return { home, away, baseline, odds, leagueId, fixtureId, live: source === "live", source };
}

// --- Classements ------------------------------------------------------------

export async function getStandings(leagueId: number): Promise<StandingRow[]> {
  const season = getLeague(leagueId)?.season ?? CURRENT_SEASON;
  if (isLive()) {
    const live = await getStandingsLive(leagueId, season);
    if (live.length) return live;
  }
  return demoStandings(leagueId);
}

function demoStandings(leagueId: number): StandingRow[] {
  const teams = DEMO_TEAMS.filter((t) => t.leagueId === leagueId);
  return teams
    .map((t) => ({
      rank: 0,
      team: t.team,
      points: t.wins * 3 + t.draws,
      played: t.played,
      wins: t.wins,
      draws: t.draws,
      losses: t.losses,
      goalsFor: t.goalsFor,
      goalsAgainst: t.goalsAgainst,
      goalDiff: t.goalsFor - t.goalsAgainst,
      form: t.form,
    }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// --- Prochains matchs -------------------------------------------------------

export async function getUpcomingFixtures(leagueId: number): Promise<Fixture[]> {
  const season = getLeague(leagueId)?.season ?? CURRENT_SEASON;
  if (isLive()) {
    const live = await getUpcomingFixturesLive(leagueId, season, 10);
    if (live.length) return live;
  }
  return demoFixtures(leagueId);
}

// --- Joueurs ---------------------------------------------------------------

export async function getTopScorers(leagueId: number): Promise<PlayerStat[]> {
  const season = getLeague(leagueId)?.season ?? CURRENT_SEASON;
  if (isLive()) {
    const live = await getTopScorersLive(leagueId, season);
    if (live.length) return live;
  }
  return demoTopScorers(leagueId);
}

function demoTopScorers(leagueId: number): PlayerStat[] {
  return DEMO_TEAMS.filter((t) => t.leagueId === leagueId)
    .slice(0, 8)
    .map((t, i) => ({
      id: 800000 + leagueId * 100 + i,
      name: [
        "Avant-centre maison",
        "Ailier décisif",
        "Finisseur clé",
        "Meneur offensif",
        "Buteur régulier",
        "Second attaquant",
        "Milieu buteur",
        "Supersub",
      ][i],
      team: t.team,
      goals: Math.max(4, Math.round(t.goalsFor / 4) - i),
      assists: Math.max(1, Math.round(t.goalsFor / 10) - Math.floor(i / 2)),
      appearances: t.played,
    }));
}

// Génère des affiches plausibles à partir des équipes démo de la ligue.
function demoFixtures(leagueId: number): Fixture[] {
  const teams = DEMO_TEAMS.filter((t) => t.leagueId === leagueId);
  const league = getLeague(leagueId);
  const out: Fixture[] = [];
  for (let i = 0; i + 1 < teams.length; i += 2) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(i / 2) + 2);
    out.push({
      id: 900000 + leagueId * 100 + i,
      leagueId,
      leagueName: league?.name,
      season: league?.season,
      date: date.toISOString(),
      status: "scheduled",
      home: teams[i].team,
      away: teams[i + 1].team,
    });
  }
  return out;
}
