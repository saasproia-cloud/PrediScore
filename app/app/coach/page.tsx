import { MessageSquare } from "lucide-react";
import { CoachChat } from "@/components/app/coach-chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement } from "@/lib/data/entitlement";
import { coachLimitFor, getDailyUsage } from "@/lib/data/usage";
import { getPrediscorePlan } from "@/lib/billing/prediscore";

export const metadata = { title: "Coach IA" };
export const dynamic = "force-dynamic";

async function coachAccess(): Promise<{ perDay: number | null; used: number }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { perDay: 0, used: 0 };
    const ent = await loadEntitlement(supabase, user.email);
    const planId = ent.active && ent.planId && getPrediscorePlan(ent.planId) ? ent.planId : null;
    const limit = coachLimitFor(planId);
    const usage = await getDailyUsage(user.email);
    return { perDay: Number.isFinite(limit) ? limit : null, used: usage.coachCount };
  } catch {
    return { perDay: 0, used: 0 };
  }
}

export default async function CoachPage() {
  const { perDay, used } = await coachAccess();
  const entitled = perDay === null || perDay > 0;

  return (
    <div>
      <header className="app-panel mb-4 rounded-lg p-4 text-left sm:mb-6 sm:p-5 sm:text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <MessageSquare className="h-3.5 w-3.5" /> Coach IA
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Discute avec ton Coach IA</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground sm:mx-auto">
          Pose n'importe quelle question sur un match — le coach répond à partir des vraies données
          et de la méthodo PrediScore.
        </p>
      </header>

      <CoachChat preview={!entitled} perDay={perDay} used={used} />
    </div>
  );
}
