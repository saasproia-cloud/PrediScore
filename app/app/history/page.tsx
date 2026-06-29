import Image from "next/image";
import Link from "next/link";
import { CalendarDays, History, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { AnalysisResult } from "@/components/app/analysis-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHistoryByFixture, listAnalysisHistory } from "@/lib/data/analysis-history";

export const metadata = { title: "Historique" };
export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ fixtureId?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? null;
  const rows = await listAnalysisHistory(email);
  const selectedFixtureId = sp.fixtureId ? Number(sp.fixtureId) : null;
  const selected = selectedFixtureId
    ? await getHistoryByFixture(email, selectedFixtureId)
    : null;

  return (
    <div>
      <header className="app-panel mb-6 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <History className="h-3.5 w-3.5" /> Historique
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Analyses enregistrées
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reviens sur un match déjà analysé sans relancer l'IA.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card/50 px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" /> Nouveau match
          </Link>
        </div>
      </header>

      {selected?.payload && (
        <div className="mb-6 space-y-4">
          <div className="app-panel-muted rounded-lg p-3 text-sm text-muted-foreground">
            Analyse déjà calculée le{" "}
            {new Date(selected.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            . Aucun nouveau crédit IA n'a été consommé.
          </div>
          <AnalysisResult data={{ ...selected.payload, history: { reused: true, id: selected.id } }} />
        </div>
      )}

      {!selected && rows.length === 0 && (
        <div className="app-panel-muted flex flex-col items-center gap-4 rounded-lg p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="h-6 w-6" />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tu n'as pas encore d'analyse enregistrée. Lance une première analyse complète pour la retrouver ici.
          </p>
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-gradient px-6 font-extrabold text-primary-foreground shadow-glow transition hover:scale-[1.01] hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" /> Analyser un match
          </Link>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid gap-3">
          {rows.map((row) => {
            const fixture = row.payload.fixture;
            return (
              <Link
                key={row.id}
                href={`/app/history?fixtureId=${row.fixtureId}`}
                className="app-hover app-panel-muted grid gap-3 rounded-lg p-3.5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-4"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {row.fixtureDate
                      ? new Date(row.fixtureDate).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "Date inconnue"}
                    {row.leagueName && <span className="truncate">· {row.leagueName}</span>}
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    {fixture?.home.logo && (
                      <Image src={fixture.home.logo} alt="" width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                    )}
                    <span className="min-w-0 truncate font-semibold">{row.homeName}</span>
                    <span className="text-xs font-black text-muted-foreground">VS</span>
                    {fixture?.away.logo && (
                      <Image src={fixture.away.logo} alt="" width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                    )}
                    <span className="min-w-0 truncate font-semibold">{row.awayName}</span>
                  </div>
                </div>
                <div className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-primary">
                  Voir l'analyse <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
