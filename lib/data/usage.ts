import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingPlanId } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type UsageKind = "analysis" | "coach";

export interface DailyUsage {
  analysisCount: number;
  coachCount: number;
}

export interface UsageResult {
  allowed: boolean;
  usage: DailyUsage;
  limit: number | null;
  error?: "usage_unavailable";
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function analysisLimitFor(planId: BillingPlanId | null | undefined): number {
  if (planId === "essentiel") return 1;
  if (planId === "pro" || planId === "lifetime") return Infinity;
  return 0;
}

export function coachLimitFor(planId: BillingPlanId | null | undefined): number {
  if (planId === "pro") return 1;
  if (planId === "lifetime") return Infinity;
  return 0;
}

function emptyUsage(): DailyUsage {
  return { analysisCount: 0, coachCount: 0 };
}

function toUsage(row: { analysis_count?: number | null; coach_count?: number | null } | null): DailyUsage {
  return {
    analysisCount: Number(row?.analysis_count ?? 0),
    coachCount: Number(row?.coach_count ?? 0),
  };
}

function countFor(usage: DailyUsage, kind: UsageKind): number {
  return kind === "analysis" ? usage.analysisCount : usage.coachCount;
}

function withIncrement(usage: DailyUsage, kind: UsageKind): DailyUsage {
  return kind === "analysis"
    ? { ...usage, analysisCount: usage.analysisCount + 1 }
    : { ...usage, coachCount: usage.coachCount + 1 };
}

function limitNumber(limit: number): number | null {
  return Number.isFinite(limit) ? limit : null;
}

async function adminClient(): Promise<SupabaseClient | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function getDailyUsage(email: string | null | undefined): Promise<DailyUsage> {
  const result = await readDailyUsage(email);
  return result.usage;
}

async function readDailyUsage(
  email: string | null | undefined,
): Promise<{ usage: DailyUsage; ok: boolean }> {
  if (!email) return { usage: emptyUsage(), ok: false };
  const admin = await adminClient();
  if (!admin) return { usage: emptyUsage(), ok: false };

  const { data, error } = await admin
    .from("daily_usage")
    .select("analysis_count, coach_count")
    .eq("email", email.toLowerCase())
    .eq("day", todayKey())
    .maybeSingle();

  if (error) {
    console.error("[PrediScore][usage] lecture daily_usage:", error.message);
    return { usage: emptyUsage(), ok: false };
  }
  return { usage: toUsage(data), ok: true };
}

export async function consumeDailyUsage(
  email: string,
  kind: UsageKind,
  limit: number,
): Promise<UsageResult> {
  const safeEmail = email.toLowerCase();
  const normalizedLimit = limitNumber(limit);
  const admin = await adminClient();
  if (!admin) {
    console.error("[PrediScore][usage] Supabase service role absent: quota non persisté.");
    const current = emptyUsage();
    if (normalizedLimit !== null) {
      return { allowed: false, usage: current, limit: normalizedLimit, error: "usage_unavailable" };
    }
    return { allowed: true, usage: withIncrement(current, kind), limit: normalizedLimit };
  }

  // Plans limités : incrément atomique en base. Sans RPC disponible, on refuse
  // l'action au lieu de risquer deux requêtes concurrentes qui dépassent le quota.
  if (normalizedLimit !== null) {
    const { data, error } = await admin
      .rpc("consume_daily_usage", {
        p_email: safeEmail,
        p_kind: kind,
        p_limit: normalizedLimit,
      })
      .single();

    if (error || !data) {
      console.error("[PrediScore][usage] RPC consume_daily_usage:", error?.message ?? "no data");
      return {
        allowed: false,
        usage: emptyUsage(),
        limit: normalizedLimit,
        error: "usage_unavailable",
      };
    }

    const row = data as {
      allowed?: boolean;
      analysis_count?: number | null;
      coach_count?: number | null;
    };
    const usage = {
      analysisCount: Number(row.analysis_count ?? 0),
      coachCount: Number(row.coach_count ?? 0),
    };
    return {
      allowed: Boolean(row.allowed),
      usage,
      limit: normalizedLimit,
    };
  }

  // Plans illimités : le compteur sert seulement d'affichage analytics.
  const read = await readDailyUsage(safeEmail);
  const current = read.usage;
  const next = withIncrement(current, kind);
  const { error } = await admin.from("daily_usage").upsert(
    {
      email: safeEmail,
      day: todayKey(),
      analysis_count: next.analysisCount,
      coach_count: next.coachCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email,day" },
  );

  if (error) {
    console.error("[PrediScore][usage] écriture daily_usage:", error.message);
    return { allowed: true, usage: next, limit: normalizedLimit };
  }

  return { allowed: true, usage: next, limit: normalizedLimit };
}
