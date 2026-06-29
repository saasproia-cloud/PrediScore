import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AnalyzeResponse } from "@/types/analysis";

export interface AnalysisHistoryRow {
  id: number;
  email: string;
  fixtureId: number;
  fixtureDate: string | null;
  homeName: string;
  awayName: string;
  leagueName: string | null;
  createdAt: string;
  payload: AnalyzeResponse;
}

function admin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createSupabaseAdminClient();
}

function mapRow(row: Record<string, unknown>): AnalysisHistoryRow {
  return {
    id: Number(row.id),
    email: String(row.email),
    fixtureId: Number(row.fixture_id),
    fixtureDate: (row.fixture_date as string | null) ?? null,
    homeName: String(row.home_name ?? ""),
    awayName: String(row.away_name ?? ""),
    leagueName: (row.league_name as string | null) ?? null,
    createdAt: String(row.created_at),
    payload: row.payload as AnalyzeResponse,
  };
}

export async function getHistoryByFixture(
  email: string | null | undefined,
  fixtureId: number | null | undefined,
): Promise<AnalysisHistoryRow | null> {
  if (!email || !fixtureId) return null;
  const supabase = admin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("fixture_id", fixtureId)
    .maybeSingle();

  if (error) {
    console.error("[PrediScore][history] lecture fixture:", error.message);
    return null;
  }
  return data ? mapRow(data) : null;
}

export async function listAnalysisHistory(
  email: string | null | undefined,
): Promise<AnalysisHistoryRow[]> {
  if (!email) return [];
  const supabase = admin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("email", email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[PrediScore][history] liste:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

export async function saveAnalysisHistory(
  email: string | null | undefined,
  payload: AnalyzeResponse,
): Promise<number | null> {
  if (!email || !payload.fixture?.id || !payload.prediction || !payload.narrative) return null;
  const supabase = admin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analysis_history")
    .upsert(
      {
        email: email.toLowerCase(),
        fixture_id: payload.fixture.id,
        fixture_date: payload.fixture.date,
        home_name: payload.teams.home.name,
        away_name: payload.teams.away.name,
        league_name: payload.fixture.leagueName ?? null,
        payload: {
          ...payload,
          history: { saved: true },
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email,fixture_id" },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[PrediScore][history] sauvegarde:", error.message);
    return null;
  }
  return data?.id ? Number(data.id) : null;
}
