// Client API-Football (v3) — SERVER ONLY. Mappe les réponses brutes vers nos
// types. Auth via `x-apisports-key` (abonnement direct api-sports.io) ; bascule
// possible sur RapidAPI via les variables d'env. Tant que la clé n'est pas
// posée, `apiFootballConfigured()` renvoie false → le provider utilise la démo.

import type {
  TeamRef,
  TeamStats,
  StandingRow,
  Fixture,
  DecimalOdds,
  PlayerStat,
  RecentMatch,
} from "@/types/football";

const DEFAULT_HOST = "https://v3.football.api-sports.io";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_CACHE_ITEMS = 800;

function apiKey(): string | undefined {
  return process.env.API_FOOTBALL_KEY || process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
}

export function apiFootballConfigured(): boolean {
  return Boolean(apiKey());
}

function baseUrl(): string {
  return process.env.API_FOOTBALL_HOST || DEFAULT_HOST;
}

function authHeaders(): Record<string, string> {
  const key = apiKey()!;
  // RapidAPI a besoin d'un host explicite ; api-sports.io direct utilise x-apisports-key.
  const rapidHost = process.env.API_FOOTBALL_RAPID_HOST;
  if (rapidHost) {
    return { "x-rapidapi-key": key, "x-rapidapi-host": rapidHost };
  }
  return { "x-apisports-key": key };
}

// --- Cache mémoire simple (TTL) — évite de cramer le quota sur des requêtes
// répétées (classements, stats). Suffisant par instance serverless ; un cache
// Supabase/KV pourra s'ajouter plus tard.
const cache = new Map<string, { at: number; data: unknown }>();
const TTL_MS = 1000 * 60 * 30; // 30 min

function trimCache(): void {
  if (cache.size <= MAX_CACHE_ITEMS) return;
  const now = Date.now();
  for (const [key, hit] of cache) {
    if (now - hit.at >= TTL_MS) cache.delete(key);
  }
  if (cache.size <= MAX_CACHE_ITEMS) return;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (cache.size <= MAX_CACHE_ITEMS) break;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, path: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.ok) return res;

      const canRetry = res.status === 429 || res.status >= 500;
      if (canRetry && attempt === 0) {
        const retryAfter = Number(res.headers.get("retry-after") ?? 0);
        await sleep(retryAfter > 0 ? Math.min(retryAfter * 1000, 2_000) : 450);
        continue;
      }

      console.error(`[football] HTTP ${res.status} sur ${path}`);
      return null;
    } catch (e) {
      if (attempt === 0) {
        await sleep(350);
        continue;
      }
      const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[football] échec ${path}:`, message);
      return null;
    }
  }
  return null;
}

async function afGet<T = unknown>(
  path: string,
  params: Record<string, string | number>,
): Promise<T[] | null> {
  if (!apiFootballConfigured()) return null;
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const url = `${baseUrl()}/${path}?${qs}`;

  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T[];

  try {
    const res = await fetchWithRetry(url, path);
    if (!res) return null;
    const json = await res.json();
    if (json?.errors && Object.keys(json.errors).length) {
      console.error(`[football] erreurs API:`, json.errors);
    }
    const data = (json?.response ?? []) as T[];
    cache.set(url, { at: Date.now(), data });
    trimCache();
    return data;
  } catch (e) {
    console.error(`[football] échec ${path}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

// --- Mapping ----------------------------------------------------------------

interface RawTeam {
  team: { id: number; name: string; logo: string; country?: string };
}

export async function searchTeamsLive(query: string): Promise<TeamRef[]> {
  const data = await afGet<RawTeam>("teams", { search: query });
  if (!data) return [];
  return data.slice(0, 12).map((d) => ({
    id: d.team.id,
    name: d.team.name,
    logo: d.team.logo,
    country: d.team.country,
  }));
}

export async function searchTeamsByCountryLive(country: string): Promise<TeamRef[]> {
  const data = await afGet<RawTeam>("teams", { country });
  if (!data) return [];
  return data.slice(0, 40).map((d) => ({
    id: d.team.id,
    name: d.team.name,
    logo: d.team.logo,
    country: d.team.country,
  }));
}

interface RawLeagueEntry {
  league: { id: number; name: string; type: string };
  seasons: { year: number; current: boolean }[];
}

// Trouve la ligue domestique courante d'une équipe (pour /teams/statistics).
export async function resolveLeagueForTeam(
  teamId: number,
  season: number,
): Promise<number | null> {
  const data = await afGet<RawLeagueEntry>("leagues", { team: teamId, season });
  if (!data?.length) return null;
  const league =
    data.find((d) => d.league.type === "League") ?? data[0];
  return league?.league.id ?? null;
}

interface RawStats {
  team: { id: number; name: string; logo: string };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number } };
    against: { total: { home: number; away: number; total: number } };
  };
  clean_sheet: { total: number };
  failed_to_score: { total: number };
}

export async function getTeamStatsLive(
  teamId: number,
  leagueId: number,
  season: number,
): Promise<TeamStats | null> {
  const data = await afGet<RawStats>("teams/statistics", {
    team: teamId,
    league: leagueId,
    season,
  });
  // /teams/statistics renvoie un objet, pas un tableau → afGet le wrappe selon l'API.
  const raw = Array.isArray(data) ? data[0] : (data as RawStats | null);
  if (!raw) return null;

  return {
    team: { id: raw.team.id, name: raw.team.name, logo: raw.team.logo },
    leagueId,
    season,
    played: raw.fixtures.played.total,
    wins: raw.fixtures.wins.total,
    draws: raw.fixtures.draws.total,
    losses: raw.fixtures.loses.total,
    goalsFor: raw.goals.for.total.total,
    goalsAgainst: raw.goals.against.total.total,
    cleanSheets: raw.clean_sheet.total,
    failedToScore: raw.failed_to_score.total,
    home: {
      played: raw.fixtures.played.home,
      goalsFor: raw.goals.for.total.home,
      goalsAgainst: raw.goals.against.total.home,
    },
    away: {
      played: raw.fixtures.played.away,
      goalsFor: raw.goals.for.total.away,
      goalsAgainst: raw.goals.against.total.away,
    },
    form: (raw.form || "").slice(-6),
  };
}

interface RawStanding {
  league: {
    standings: Array<
      Array<{
        rank: number;
        team: { id: number; name: string; logo: string };
        points: number;
        goalsDiff: number;
        all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
        form: string;
      }>
    >;
  };
}

export async function getStandingsLive(
  leagueId: number,
  season: number,
): Promise<StandingRow[]> {
  const data = await afGet<RawStanding>("standings", { league: leagueId, season });
  const table = data?.[0]?.league?.standings?.[0];
  if (!table) return [];
  return table.map((r) => ({
    rank: r.rank,
    team: { id: r.team.id, name: r.team.name, logo: r.team.logo },
    points: r.points,
    played: r.all.played,
    wins: r.all.win,
    draws: r.all.draw,
    losses: r.all.lose,
    goalsFor: r.all.goals.for,
    goalsAgainst: r.all.goals.against,
    goalDiff: r.goalsDiff,
    form: r.form,
  }));
}

interface RawFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; season?: number };
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
  goals: { home: number | null; away: number | null };
}

function mapFixture(f: RawFixture): Fixture {
  const live = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(f.fixture.status.short);
  const finished = ["FT", "AET", "PEN"].includes(f.fixture.status.short);
  return {
    id: f.fixture.id,
    leagueId: f.league.id,
    leagueName: f.league.name,
    season: f.league.season,
    date: f.fixture.date,
    status: live ? "live" : finished ? "finished" : "scheduled",
    home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
    away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
    goalsHome: f.goals.home ?? undefined,
    goalsAway: f.goals.away ?? undefined,
  };
}

export async function getUpcomingFixturesLive(
  leagueId: number,
  season: number,
  next = 10,
): Promise<Fixture[]> {
  const data = await afGet<RawFixture>("fixtures", { league: leagueId, season, next });
  return data ? data.map(mapFixture) : [];
}

export async function getUpcomingFixturesForTeamLive(
  teamId: number,
  next = 8,
): Promise<Fixture[]> {
  const data = await afGet<RawFixture>("fixtures", { team: teamId, next });
  return data ? data.map(mapFixture) : [];
}

export async function getFixtureByIdLive(fixtureId: number): Promise<Fixture | null> {
  const data = await afGet<RawFixture>("fixtures", { id: fixtureId });
  return data?.[0] ? mapFixture(data[0]) : null;
}

export async function getFixtureBetweenLive(
  homeId: number,
  awayId: number,
): Promise<Fixture | null> {
  const data = await afGet<RawFixture>("fixtures/headtohead", {
    h2h: `${homeId}-${awayId}`,
    next: 1,
  });
  return data?.[0] ? mapFixture(data[0]) : null;
}

export async function getRecentFixtureBetweenLive(
  homeId: number,
  awayId: number,
): Promise<Fixture | null> {
  const data = await afGet<RawFixture>("fixtures/headtohead", {
    h2h: `${homeId}-${awayId}`,
    last: 8,
  });
  const finished = data?.map(mapFixture).find((fixture) => fixture.status === "finished");
  return finished ?? null;
}

export async function getRecentFixturesForTeamLive(
  teamId: number,
  last = 8,
): Promise<RecentMatch[]> {
  const data = await afGet<RawFixture>("fixtures", { team: teamId, last });
  if (!data?.length) return [];
  return data
    .filter((f) => f.goals.home != null && f.goals.away != null)
    .map((f) => {
      const isHome = f.teams.home.id === teamId;
      const opponent = isHome ? f.teams.away : f.teams.home;
      const goalsFor = Number(isHome ? f.goals.home : f.goals.away);
      const goalsAgainst = Number(isHome ? f.goals.away : f.goals.home);
      return {
        opponent: opponent.name,
        opponentLogo: opponent.logo,
        homeAway: isHome ? "H" : "A",
        goalsFor,
        goalsAgainst,
        result: goalsFor > goalsAgainst ? "W" : goalsFor === goalsAgainst ? "D" : "L",
        date: f.fixture.date,
      };
    });
}

interface RawOdds {
  bookmakers: Array<{
    bets: Array<{ name: string; values: Array<{ value: string; odd: string }> }>;
  }>;
}

export async function getOddsLive(fixtureId: number): Promise<DecimalOdds | null> {
  const data = await afGet<RawOdds>("odds", { fixture: fixtureId });
  const bet = data?.[0]?.bookmakers?.[0]?.bets?.find((b) => b.name === "Match Winner");
  if (!bet) return null;
  const find = (v: string) => Number(bet.values.find((x) => x.value === v)?.odd);
  const home = find("Home");
  const draw = find("Draw");
  const away = find("Away");
  if (!home || !draw || !away) return null;
  return { home, draw, away };
}

interface RawTopScorer {
  player: { id: number; name: string; photo?: string };
  statistics: Array<{
    team: { id: number; name: string; logo?: string };
    games: { appearences?: number; appearances?: number };
    goals: { total?: number; assists?: number };
  }>;
}

export async function getTopScorersLive(
  leagueId: number,
  season: number,
): Promise<PlayerStat[]> {
  const data = await afGet<RawTopScorer>("players/topscorers", { league: leagueId, season });
  if (!data?.length) return [];
  return data.slice(0, 12).map((row) => {
    const s = row.statistics?.[0];
    return {
      id: row.player.id,
      name: row.player.name,
      photo: row.player.photo,
      team: {
        id: s?.team.id ?? 0,
        name: s?.team.name ?? "",
        logo: s?.team.logo,
      },
      goals: Number(s?.goals.total ?? 0),
      assists: s?.goals.assists ?? undefined,
      appearances: s?.games.appearences ?? s?.games.appearances ?? undefined,
    };
  });
}
