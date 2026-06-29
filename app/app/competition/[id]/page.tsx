import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLeague } from "@/lib/football/leagues";
import { getStandings, getTopScorers, getUpcomingFixtures } from "@/lib/football/provider";
import { CompetitionTabs } from "@/components/app/competition-tabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEntitlement } from "@/lib/data/entitlement";
import { getPrediscorePlan } from "@/lib/billing/prediscore";

export const dynamic = "force-dynamic";

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

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const league = getLeague(Number(id));
  if (!league) notFound();

  const [standings, fixtures, topScorers, premium] = await Promise.all([
    getStandings(league.id),
    getUpcomingFixtures(league.id),
    getTopScorers(league.id),
    hasPremiumAccess(),
  ]);

  return (
    <div>
      <Link href="/app/competitions" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Compétitions
      </Link>

      <header className="app-panel mb-6 flex items-center gap-3 rounded-lg p-4 sm:p-5">
        {league.logo && <Image src={league.logo} alt={league.name} width={44} height={44} className="h-10 w-10 object-contain" />}
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">{league.name}</h1>
          <p className="text-xs text-muted-foreground">{league.flag} {league.country} · {league.season}/{league.season + 1}</p>
        </div>
      </header>

      <CompetitionTabs league={league} standings={standings} fixtures={fixtures} topScorers={topScorers} premium={premium} />
    </div>
  );
}
