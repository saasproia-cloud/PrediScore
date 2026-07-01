import { cookies } from "next/headers";
import { Sidebar, MobileNav } from "@/components/app/sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement } from "@/lib/data/entitlement";
import { analysisLimitFor, getDailyUsage } from "@/lib/data/usage";
import type { BillingPlanId } from "@/types";
import { getPrediscorePlan } from "@/lib/billing/prediscore";
import { REF_COOKIE, isAdminEmail } from "@/lib/affiliate/config";
import { ensureReferral } from "@/lib/data/affiliate";

export const dynamic = "force-dynamic";

async function appAccount() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email)
      return { planId: null, active: false, analysisCount: 0, analysisLimit: 0, isAdmin: false };

    // Affiliation : enregistre le parrainage si un cookie ?ref est présent (idempotent).
    const ref = (await cookies()).get(REF_COOKIE)?.value;
    if (ref) void ensureReferral(user.email, ref).catch(() => {});

    const ent = await loadEntitlement(supabase, user.email);
    const usage = await getDailyUsage(user.email);
    const planId = ent.active && ent.planId && getPrediscorePlan(ent.planId) ? ent.planId : null;
    const limit = analysisLimitFor(planId);
    return {
      planId,
      active: ent.active && Boolean(planId),
      analysisCount: usage.analysisCount,
      analysisLimit: Number.isFinite(limit) ? limit : null,
      isAdmin: isAdminEmail(user.email),
    };
  } catch {
    return {
      planId: null as BillingPlanId | null,
      active: false,
      analysisCount: 0,
      analysisLimit: 0,
      isAdmin: false,
    };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await appAccount();
  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-8%,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_82%_4%,hsl(var(--gold)/0.09),transparent_30%),radial-gradient(circle_at_62%_96%,hsl(var(--gold)/0.05),transparent_32%),linear-gradient(180deg,hsl(0_0%_5%),hsl(0_0%_3.5%))]" />
      <div className="dashboard-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.035] to-transparent" />
      <Sidebar account={account} />
      <main className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:pb-10 xl:px-10">
        <div className="app-page-enter mx-auto min-w-0 w-full max-w-6xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
