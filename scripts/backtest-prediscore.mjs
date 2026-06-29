#!/usr/bin/env node
import fs from "node:fs";

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  const text = fs.readFileSync(".env", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

loadEnv();

const KEY = process.env.API_FOOTBALL_KEY || process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
const HOST = process.env.API_FOOTBALL_HOST || "https://v3.football.api-sports.io";
const LEAGUE = Number(process.env.BACKTEST_LEAGUE || 39);
const SEASON = Number(process.env.BACKTEST_SEASON || 2024);
const LIMIT = Number(process.env.BACKTEST_LIMIT || 20);
const FROM = process.env.BACKTEST_FROM || `${SEASON}-08-01`;
const TO = process.env.BACKTEST_TO || `${SEASON + 1}-05-31`;

if (!KEY) {
  console.error("API_FOOTBALL_KEY manquante dans .env");
  process.exit(1);
}

const cache = new Map();

async function af(path, params) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const url = `${HOST}/${path}?${qs}`;
  if (cache.has(url)) return cache.get(url);
  const headers = process.env.API_FOOTBALL_RAPID_HOST
    ? { "x-rapidapi-key": KEY, "x-rapidapi-host": process.env.API_FOOTBALL_RAPID_HOST }
    : { "x-apisports-key": KEY };
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  const json = await res.json();
  const data = json?.response ?? [];
  cache.set(url, data);
  return data;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function poisson(k, lambda) {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / fact;
}

function scoreMatrix(home, away, maxGoals = 8) {
  const out = [];
  let sum = 0;
  for (let h = 0; h <= maxGoals; h++) {
    out[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p = poisson(h, home) * poisson(a, away);
      out[h][a] = p;
      sum += p;
    }
  }
  return out.map((row) => row.map((p) => p / sum));
}

function markets(matrix) {
  let home = 0;
  let draw = 0;
  let away = 0;
  const scores = [];
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
      scores.push({ home: h, away: a, prob: p });
    }
  }
  scores.sort((x, y) => y.prob - x.prob);
  return { outcome: { home, draw, away }, score: scores[0] };
}

function devig(odds) {
  if (!odds) return null;
  const raw = { home: 1 / odds.home, draw: 1 / odds.draw, away: 1 / odds.away };
  const sum = raw.home + raw.draw + raw.away;
  return { home: raw.home / sum, draw: raw.draw / sum, away: raw.away / sum };
}

function blend(model, market, weight) {
  if (!market) return model;
  const home = model.home * (1 - weight) + market.home * weight;
  const draw = model.draw * (1 - weight) + market.draw * weight;
  const away = model.away * (1 - weight) + market.away * weight;
  const sum = home + draw + away;
  return { home: home / sum, draw: draw / sum, away: away / sum };
}

async function getStats(teamId) {
  const data = await af("teams/statistics", { team: teamId, league: LEAGUE, season: SEASON });
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw?.fixtures?.played?.total) return null;
  return {
    played: raw.fixtures.played.total,
    wins: raw.fixtures.wins.total,
    draws: raw.fixtures.draws.total,
    goalsFor: raw.goals.for.total.total,
    goalsAgainst: raw.goals.against.total.total,
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
    cleanSheets: raw.clean_sheet.total,
    failedToScore: raw.failed_to_score.total,
    form: raw.form || "",
  };
}

async function getOdds(fixtureId) {
  const data = await af("odds", { fixture: fixtureId });
  const bet = data?.[0]?.bookmakers?.[0]?.bets?.find((b) => b.name === "Match Winner");
  if (!bet) return null;
  const find = (v) => Number(bet.values.find((x) => x.value === v)?.odd);
  const odds = { home: find("Home"), draw: find("Draw"), away: find("Away") };
  return odds.home && odds.draw && odds.away ? odds : null;
}

async function getRecent(teamId) {
  const data = await af("fixtures", { team: teamId, last: 8 });
  return (data ?? [])
    .filter((f) => f.goals.home != null && f.goals.away != null)
    .map((f) => {
      const isHome = f.teams.home.id === teamId;
      const gf = Number(isHome ? f.goals.home : f.goals.away);
      const ga = Number(isHome ? f.goals.away : f.goals.home);
      return { gf, ga, result: gf > ga ? "W" : gf === ga ? "D" : "L" };
    });
}

function recentProfile(matches, stats) {
  if (matches.length) {
    let pts = 0;
    let gf = 0;
    let ga = 0;
    let cs = 0;
    let fts = 0;
    for (const m of matches) {
      pts += m.result === "W" ? 3 : m.result === "D" ? 1 : 0;
      gf += m.gf;
      ga += m.ga;
      if (m.ga === 0) cs++;
      if (m.gf === 0) fts++;
    }
    return {
      played: matches.length,
      ppg: pts / matches.length,
      gf: gf / matches.length,
      ga: ga / matches.length,
      cs: cs / matches.length,
      fts: fts / matches.length,
    };
  }
  return {
    played: 0,
    ppg: (stats.wins * 3 + stats.draws) / stats.played,
    gf: null,
    ga: null,
    cs: stats.cleanSheets / stats.played,
    fts: stats.failedToScore / stats.played,
  };
}

function ratioMult(value, baseline, sample, weight) {
  if (value == null) return 1;
  const sampleWeight = Math.min(1, sample / 6);
  return clamp(1 + (clamp(value / baseline, 0.35, 2.8) - 1) * weight * sampleWeight, 0.84, 1.18);
}

function expected(homeStats, awayStats, homeRecent, awayRecent) {
  const baseHome = 1.5;
  const baseAway = 1.15;
  const avgGoal = (baseHome + baseAway) / 2;
  const hAttack = (homeStats.home.goalsFor + baseHome * 6) / (homeStats.home.played + 6) / baseHome;
  const hDef = (homeStats.home.goalsAgainst + baseAway * 6) / (homeStats.home.played + 6) / baseAway;
  const aAttack = (awayStats.away.goalsFor + baseAway * 6) / (awayStats.away.played + 6) / baseAway;
  const aDef = (awayStats.away.goalsAgainst + baseHome * 6) / (awayStats.away.played + 6) / baseHome;
  const ppgDiff =
    ((homeStats.wins * 3 + homeStats.draws) / homeStats.played -
      (awayStats.wins * 3 + awayStats.draws) / awayStats.played) /
    3;
  let home = hAttack * aDef * baseHome * clamp(1 + ppgDiff * 0.1, 0.9, 1.1);
  home *= ratioMult(homeRecent.gf, avgGoal, homeRecent.played, 0.16);
  home *= ratioMult(awayRecent.ga, avgGoal, awayRecent.played, 0.14);
  home *= clamp(1 - awayRecent.cs * 0.08 - homeRecent.fts * 0.07, 0.84, 1.05);

  let away = aAttack * hDef * baseAway * clamp(1 - ppgDiff * 0.1, 0.9, 1.1);
  away *= ratioMult(awayRecent.gf, avgGoal, awayRecent.played, 0.16);
  away *= ratioMult(homeRecent.ga, avgGoal, homeRecent.played, 0.14);
  away *= clamp(1 - homeRecent.cs * 0.08 - awayRecent.fts * 0.07, 0.84, 1.05);

  return { home: clamp(home, 0.15, 6), away: clamp(away, 0.15, 6) };
}

function pick(outcome) {
  return Object.entries(outcome).sort((a, b) => b[1] - a[1])[0][0];
}

const fixtures = (await af("fixtures", { league: LEAGUE, season: SEASON, from: FROM, to: TO }))
  .filter((f) => f.goals.home != null && f.goals.away != null)
  .sort((a, b) => Date.parse(b.fixture.date) - Date.parse(a.fixture.date))
  .slice(0, LIMIT);

let winnerHits = 0;
let exactHits = 0;
let tested = 0;

for (const fx of fixtures) {
  const [homeStats, awayStats, homeRecentRaw, awayRecentRaw, odds] = await Promise.all([
    getStats(fx.teams.home.id),
    getStats(fx.teams.away.id),
    getRecent(fx.teams.home.id),
    getRecent(fx.teams.away.id),
    getOdds(fx.fixture.id).catch(() => null),
  ]);
  if (!homeStats || !awayStats) continue;
  const xg = expected(
    homeStats,
    awayStats,
    recentProfile(homeRecentRaw, homeStats),
    recentProfile(awayRecentRaw, awayStats),
  );
  const m = markets(scoreMatrix(xg.home, xg.away));
  const outcome = blend(m.outcome, devig(odds), odds ? 0.58 : 0);
  const predicted = pick(outcome);
  const actual = fx.goals.home > fx.goals.away ? "home" : fx.goals.home === fx.goals.away ? "draw" : "away";
  const winnerOk = predicted === actual;
  const exactOk = m.score.home === fx.goals.home && m.score.away === fx.goals.away;
  if (winnerOk) winnerHits++;
  if (exactOk) exactHits++;
  tested++;
  console.log(
    `${winnerOk ? "OK " : "NO "} ${fx.teams.home.name} ${fx.goals.home}-${fx.goals.away} ${fx.teams.away.name} | pick=${predicted} | score=${m.score.home}-${m.score.away}`,
  );
}

console.log("");
console.log(`Backtest PrediScore league=${LEAGUE} season=${SEASON} range=${FROM}..${TO}`);
console.log(`1-N-2: ${winnerHits}/${tested} (${Math.round((winnerHits / Math.max(1, tested)) * 100)}%)`);
console.log(`Scores exacts: ${exactHits}/${tested} (${Math.round((exactHits / Math.max(1, tested)) * 100)}%)`);
