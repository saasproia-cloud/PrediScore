import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getMatchContext,
  getMatchContextByFixture,
  isLive,
  searchFixturesForTeams,
  type MatchContext,
} from "@/lib/football/provider";
import { predictMatch, type MatchPrediction } from "@/lib/engine/predict";
import { generateMatchNarrative, type MatchNarrative } from "@/lib/ai/match-narrative";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement, type Entitlement } from "@/lib/data/entitlement";
import {
  analysisLimitFor,
  consumeDailyUsage,
  getDailyUsage,
} from "@/lib/data/usage";
import { getPrediscorePlan } from "@/lib/billing/prediscore";
import { getHistoryByFixture, saveAnalysisHistory } from "@/lib/data/analysis-history";
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { parseJsonBody, RequestBodyError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  fixtureId: z.union([z.string().min(1).max(32), z.number()]).optional(),
  home: z.union([z.string().min(1).max(80), z.number()]).optional(),
  away: z.union([z.string().min(1).max(80), z.number()]).optional(),
  // Aperçu privé, uniquement si PREDISCORE_PREVIEW_UNLOCK=1 côté serveur.
  preview: z.boolean().optional(),
});

interface CachedFullAnalysis {
  prediction: MatchPrediction;
  narrative: MatchNarrative;
}

function buildPostMatch(ctx: MatchContext) {
  const fixture = ctx.fixture;
  const homeGoals = fixture?.goalsHome;
  const awayGoals = fixture?.goalsAway;
  if (!fixture || fixture.status !== "finished" || homeGoals == null || awayGoals == null) return null;

  const winner =
    homeGoals > awayGoals ? "home" : awayGoals > homeGoals ? "away" : "draw";
  const winnerText =
    winner === "home"
      ? `Victoire de ${ctx.home.team.name}`
      : winner === "away"
        ? `Victoire de ${ctx.away.team.name}`
        : "Le match s'est terminé sur un nul";
  const totalGoals = homeGoals + awayGoals;

  return {
    finished: true as const,
    finalScore: { home: homeGoals, away: awayGoals },
    winner,
    summary: `${winnerText} ${homeGoals}-${awayGoals}. Résumé gratuit basé sur le score final et les données réelles disponibles pour ce match terminé.`,
    stats: [
      { label: "Buts", home: homeGoals, away: awayGoals },
      { label: "Buts saison", home: ctx.home.goalsFor, away: ctx.away.goalsFor },
      { label: "Victoires saison", home: ctx.home.wins, away: ctx.away.wins },
      { label: "Clean sheets", home: ctx.home.cleanSheets ?? 0, away: ctx.away.cleanSheets ?? 0 },
      { label: "Total buts", home: totalGoals, away: Math.max(0, 4 - totalGoals) },
    ],
  };
}

const fullAnalysisCache = new Map<string, { expiresAt: number; value: CachedFullAnalysis }>();
const FULL_ANALYSIS_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_FULL_ANALYSIS_CACHE = 300;

function sweepFullAnalysisCache(now: number): void {
  for (const [key, hit] of fullAnalysisCache) {
    if (hit.expiresAt <= now) fullAnalysisCache.delete(key);
  }
  if (fullAnalysisCache.size <= MAX_FULL_ANALYSIS_CACHE) return;
  for (const key of fullAnalysisCache.keys()) {
    fullAnalysisCache.delete(key);
    if (fullAnalysisCache.size <= MAX_FULL_ANALYSIS_CACHE) break;
  }
}

async function fullAnalysisFor(ctx: MatchContext): Promise<CachedFullAnalysis> {
  const key = ctx.fixtureId
    ? `fixture:${ctx.fixtureId}:${ctx.source}`
    : `teams:${ctx.home.team.id}:${ctx.away.team.id}:${ctx.source}`;
  const now = Date.now();
  sweepFullAnalysisCache(now);
  const hit = fullAnalysisCache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  const prediction = predictMatch({
    home: ctx.home,
    away: ctx.away,
    baseline: ctx.baseline,
    odds: ctx.odds,
  });
  const narrative = await generateMatchNarrative(prediction);
  const value = { prediction, narrative };
  fullAnalysisCache.set(key, { expiresAt: Date.now() + FULL_ANALYSIS_TTL_MS, value });
  return value;
}

// Lit l'abonnement actif via la session Supabase (vérité serveur).
async function currentEntitlement(): Promise<{ email: string | null; ent: Entitlement }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { email: null, ent: { active: false, planId: null } };
    const ent = await loadEntitlement(supabase, user.email);
    return { email: user.email.toLowerCase(), ent };
  } catch {
    return { email: null, ent: { active: false, planId: null } };
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`analyze:${ip}`, { limit: 18, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited);

  const json = (body: unknown, init?: ResponseInit) =>
    withRateLimitHeaders(NextResponse.json(body, init), limited);

  let parsed;
  try {
    parsed = await parseJsonBody(req, Body, 16_000);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    const message = error instanceof RequestBodyError ? error.message : "Requête invalide.";
    return json({ error: message }, { status });
  }

  if (!parsed.fixtureId && (!parsed.home || !parsed.away)) {
    return json(
      { error: "Choisis un vrai match à analyser." },
      { status: 400 },
    );
  }

  if (!parsed.fixtureId && String(parsed.home) === String(parsed.away)) {
    return json({ error: "Choisis deux équipes différentes." }, { status: 400 });
  }

  const { email, ent } = await currentEntitlement();
  if (email) {
    const userLimited = rateLimit(`analyze:user:${email}`, { limit: 24, windowMs: 60_000 });
    if (!userLimited.allowed) return rateLimitResponse(userLimited);
  }

  let ctx = parsed.fixtureId
    ? await getMatchContextByFixture(parsed.fixtureId)
    : null;

  // Compatibilité douce pour les anciens liens ?home=&away= : en live, on ne
  // simule pas un match libre. On cherche d'abord une vraie fixture directe.
  if (!ctx && !parsed.fixtureId && parsed.home && parsed.away && isLive()) {
    const found = await searchFixturesForTeams({ home: parsed.home, away: parsed.away });
    const direct = found.mode === "direct" ? found.fixtures[0] : null;
    if (direct) {
      ctx = await getMatchContextByFixture(direct.id);
    } else {
      return json(
        {
          error:
            "Aucun prochain match officiel direct trouvé. Choisis un des vrais prochains matchs proposés.",
          fixtures: found.fixtures,
          mode: found.mode,
          source: found.source,
        },
        { status: 409 },
      );
    }
  }

  if (!ctx && !parsed.fixtureId && parsed.home && parsed.away) {
    ctx = await getMatchContext(parsed.home, parsed.away);
  }

  if (!ctx) {
    return json(
      { error: "Match introuvable ou données insuffisantes pour cette fixture." },
      { status: 404 },
    );
  }

  const entitled = ent.active && Boolean(ent.planId && getPrediscorePlan(ent.planId));
  const limit = analysisLimitFor(entitled ? ent.planId : null);
  const usage = email ? await getDailyUsage(email) : { analysisCount: 0, coachCount: 0 };
  const previewAllowed =
    process.env.NODE_ENV !== "production" &&
    process.env.PREDISCORE_PREVIEW_UNLOCK === "1" &&
    parsed.preview === true;
  const teams = {
    home: ctx.home.team,
    away: ctx.away.team,
    homeStats: ctx.home,
    awayStats: ctx.away,
  };
  const base = {
    entitled,
    teams,
    fixture: ctx.fixture,
    live: ctx.live,
    source: ctx.source,
    usage: {
      analysisCount: usage.analysisCount,
      analysisLimit: Number.isFinite(limit) ? limit : null,
    },
  };

  const postMatch = buildPostMatch(ctx);
  if (postMatch) {
    return json({
      ...base,
      access: { fullAccess: false, planId: ent.planId, reason: "free" },
      postMatch,
    });
  }

  const fixtureHistory = ctx.fixtureId ? await getHistoryByFixture(email, ctx.fixtureId) : null;
  if (fixtureHistory?.payload) {
    return json({
      ...fixtureHistory.payload,
      usage: {
        analysisCount: usage.analysisCount,
        analysisLimit: Number.isFinite(limit) ? limit : null,
      },
      history: { reused: true, id: fixtureHistory.id },
    });
  }

  // GRATUIT → on renvoie uniquement l'aperçu (équipes + forme). Aucune donnée de
  // prédiction n'est envoyée : le gating est réel, pas contournable côté client.
  if (!entitled && !previewAllowed) {
    return json({
      ...base,
      access: { fullAccess: false, planId: null, reason: "free" },
    });
  }

  if (previewAllowed) {
    const { prediction, narrative } = await fullAnalysisFor(ctx);
    const response = {
      ...base,
      access: { fullAccess: true, planId: ent.planId, reason: "preview" },
      prediction,
      narrative,
    };
    return json(response);
  }

  if (!email || limit <= 0) {
    return json(
      {
        ...base,
        access: { fullAccess: false, planId: ent.planId, reason: "free" },
      },
      { status: 403 },
    );
  }

  const consumed = await consumeDailyUsage(email, "analysis", limit);
  if (!consumed.allowed) {
    return json(
      {
        ...base,
        error:
          consumed.error === "usage_unavailable"
            ? "Quota momentanément indisponible. Réessaie dans quelques instants."
            : "Quota du jour atteint.",
        usage: {
          analysisCount: consumed.usage.analysisCount,
          analysisLimit: consumed.limit,
        },
        access: { fullAccess: false, planId: ent.planId, reason: "quota" },
      },
      { status: consumed.error === "usage_unavailable" ? 503 : 429 },
    );
  }

  // ABONNÉ (ou aperçu) → analyse complète.
  const { prediction, narrative } = await fullAnalysisFor(ctx);

  const response = {
    ...base,
    usage: {
      analysisCount: consumed.usage.analysisCount,
      analysisLimit: consumed.limit,
    },
    access: { fullAccess: true, planId: ent.planId },
    prediction,
    narrative,
  };
  const historyId = await saveAnalysisHistory(email, response);
  return json({
    ...response,
    history: historyId ? { saved: true, id: historyId } : undefined,
  });
}
