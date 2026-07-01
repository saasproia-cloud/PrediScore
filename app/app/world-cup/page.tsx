import { WorldCupView } from "@/components/app/world-cup-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement } from "@/lib/data/entitlement";
import { getPrediscorePlan } from "@/lib/billing/prediscore";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupe du monde 2026" };

async function hasPremiumAccess() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return false;
    const ent = await loadEntitlement(supabase, user.email);
    return Boolean(ent.active && ent.planId && getPrediscorePlan(ent.planId));
  } catch {
    return false;
  }
}

export default async function WorldCupPage() {
  const entitled = await hasPremiumAccess();
  return <WorldCupView entitled={entitled} />;
}
