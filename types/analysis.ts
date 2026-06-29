import type { MatchPrediction } from "@/lib/engine/predict";
import type { MatchNarrative } from "@/lib/ai/match-narrative";
import type { Fixture, TeamRef, TeamStats } from "@/types/football";
import type { BillingPlanId } from "@/types/billing";

export type FootballDataSource = "live" | "fallback" | "demo";

export interface AnalyzeAccess {
  fullAccess: boolean;
  planId: BillingPlanId | null;
  reason?: "free" | "quota" | "preview";
}

export interface AnalyzeUsage {
  analysisCount: number;
  analysisLimit: number | null;
}

export interface AnalyzeResponse {
  /** Abonnement actif côté serveur (vérité). */
  entitled: boolean;
  source: FootballDataSource;
  access: AnalyzeAccess;
  usage?: AnalyzeUsage;
  teams: {
    home: TeamRef;
    away: TeamRef;
    homeStats: TeamStats;
    awayStats: TeamStats;
  };
  fixture?: Fixture;
  live: boolean;
  // Présents UNIQUEMENT si l'utilisateur a accès (entitled ou aperçu) — sinon le
  // serveur ne les envoie pas du tout (gating réel, non contournable côté client).
  prediction?: MatchPrediction;
  narrative?: MatchNarrative;
  postMatch?: {
    finished: true;
    finalScore: { home: number; away: number };
    winner: "home" | "away" | "draw";
    summary: string;
    stats: Array<{ label: string; home: number; away: number; suffix?: string }>;
  };
  history?: {
    reused?: boolean;
    saved?: boolean;
    id?: number;
  };
}
