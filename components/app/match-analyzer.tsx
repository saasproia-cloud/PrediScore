"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TeamSearchInput } from "./team-search-input";
import { AnalysisResult } from "./analysis-result";
import type { Fixture, TeamRef } from "@/types/football";
import type { AnalyzeResponse, FootballDataSource } from "@/types/analysis";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  "Lecture du match sélectionné...",
  "Analyse des formes et dynamiques...",
  "Calcul des forces domicile / extérieur...",
  "Simulation des scénarios de score...",
  "Préparation du verdict IA...",
];

type FixtureMode = "direct" | "team-upcoming" | "mixed";

interface FixtureSearchResponse {
  fixtures: Fixture[];
  mode: FixtureMode;
  source: FootballDataSource;
  error?: string;
}

export function MatchAnalyzer({
  initialTeam,
  initialTeamId,
  initialFixtureId,
}: {
  initialTeam?: string;
  initialTeamId?: string;
  initialFixtureId?: string;
}) {
  const router = useRouter();
  const [team, setTeam] = useState<TeamRef | null>(null);
  const [opponent, setOpponent] = useState<TeamRef | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixtureMode, setFixtureMode] = useState<FixtureMode>("team-upcoming");
  const [fixtureLoading, setFixtureLoading] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ranInitial = useRef(false);

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setSelectedFixture(null);
    if (team) void loadFixtures(team, opponent);
  };

  const loadFixtures = useCallback(async (main: TeamRef, second?: TeamRef | null) => {
    setFixtureLoading(true);
    setError(null);
    setResult(null);
    setSelectedFixture(null);
    try {
      const params = new URLSearchParams();
      const mainKey = main.id > 0 ? String(main.id) : main.name;
      if (second) {
        params.set("home", mainKey);
        params.set("away", second.id > 0 ? String(second.id) : second.name);
      } else {
        params.set("team", mainKey);
      }
      const res = await fetch(`/api/fixtures/search?${params.toString()}`);
      const data = (await res.json()) as FixtureSearchResponse;
      if (!res.ok) {
        setError(data.error ?? "Impossible de récupérer les prochains matchs.");
        setFixtures([]);
        return;
      }
      setFixtures(data.fixtures ?? []);
      setFixtureMode(data.mode);
      if (!data.fixtures?.length) {
        setError("Aucun prochain match officiel trouvé pour cette recherche.");
      }
    } catch {
      setError("Impossible de contacter le serveur de matchs.");
      setFixtures([]);
    } finally {
      setFixtureLoading(false);
    }
  }, []);

  const run = useCallback(async (fixture: Fixture) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStep(0);
    setSelectedFixture(fixture);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId: fixture.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else if (data.history?.reused && data.history.id) {
        router.push(`/app/history?fixtureId=${fixture.id}`);
      } else {
        setResult(data);
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 700);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (team) void loadFixtures(team, opponent);
  }, [team, opponent, loadFixtures]);

  useEffect(() => {
    if (ranInitial.current) return;
    ranInitial.current = true;

    if (initialFixtureId) {
      const fixture: Fixture = {
        id: Number(initialFixtureId),
        leagueId: 0,
        date: new Date().toISOString(),
        status: "scheduled",
        home: { id: 0, name: "Équipe domicile" },
        away: { id: 0, name: "Équipe extérieur" },
      };
      void run(fixture);
      return;
    }

    if (initialTeam) {
      setTeam({
        id: initialTeamId && Number.isFinite(Number(initialTeamId)) ? Number(initialTeamId) : -1,
        name: initialTeam,
      });
    }
  }, [initialFixtureId, initialTeam, initialTeamId, run]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="app-panel rounded-lg p-3.5 sm:p-5">
        <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Match officiel à analyser
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
          <TeamSearchInput
            placeholder="Recherche une équipe (ex : Morocco, France, PSG...)"
            value={team}
            onChange={setTeam}
          />
          <div className="hidden text-center text-xs font-bold text-muted-foreground sm:block">+</div>
          <TeamSearchInput
            placeholder="Optionnel : adversaire souhaité"
            value={opponent}
            onChange={setOpponent}
          />
        </div>

      </div>

      {!loading && !result && (fixtureLoading || team || fixtures.length > 0) && (
        <FixturePanel
          fixtures={fixtures}
          loading={fixtureLoading}
          mode={fixtureMode}
          hasOpponent={Boolean(opponent)}
          selectedId={selectedFixture?.id}
          onSelect={setSelectedFixture}
          onAnalyze={run}
          analyzing={loading}
        />
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-panel rounded-lg p-5 sm:p-8"
        >
          <div className="flex items-center justify-center gap-5 sm:gap-10">
            <CrestPulse team={selectedFixture?.home ?? null} />
            <span className="text-sm font-extrabold text-muted-foreground">VS</span>
            <CrestPulse team={selectedFixture?.away ?? null} />
          </div>

          <div className="mx-auto mt-7 flex h-10 items-end justify-center gap-1.5">
            {[0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.5, 0.75, 0.45].map((h, i) => (
              <span
                key={i}
                className="eq-bar w-1.5 rounded-full bg-gradient-to-t from-primary/40 to-primary"
                style={{ height: `${h * 100}%`, animationDelay: `${i * 0.09}s` }}
              />
            ))}
          </div>

          <div className="mx-auto mt-6 h-1.5 max-w-sm overflow-hidden rounded-full bg-muted/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
              style={{ width: `${((step + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="mx-auto mt-5 max-w-sm space-y-2">
            {LOADING_STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 text-sm transition ${
                  i < step ? "text-muted-foreground" : i === step ? "text-foreground" : "text-muted-foreground/40"
                }`}
              >
                {i < step ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : i === step ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-current" />
                )}
                {s}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-sm text-destructive-foreground sm:p-4">
          {error}
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={resetAnalysis}
              className="app-hover rounded-lg border border-border bg-card/[0.55] px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Analyser un autre match
            </button>
          </div>
          <AnalysisResult data={result} />
        </motion.div>
      )}
    </div>
  );
}

function FixturePanel({
  fixtures,
  loading,
  mode,
  hasOpponent,
  selectedId,
  onSelect,
  onAnalyze,
  analyzing,
}: {
  fixtures: Fixture[];
  loading: boolean;
  mode: FixtureMode;
  hasOpponent: boolean;
  selectedId?: number;
  onSelect: (fixture: Fixture) => void;
  onAnalyze: (fixture: Fixture) => void;
  analyzing: boolean;
}) {
  const title = mode === "direct" ? "Duel trouvé" : hasOpponent ? "Matchs disponibles" : "Prochains matchs";

  return (
    <div className="app-panel-muted relative z-0 overflow-visible rounded-lg p-3.5 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            {title}
          </h2>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/80 bg-background/[0.45] p-4 text-sm text-muted-foreground sm:p-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Recherche des vrais prochains matchs...
        </div>
      )}

      {!loading && !fixtures.length && (
        <div className="rounded-lg border border-border/80 bg-background/[0.45] p-4 text-center text-sm text-muted-foreground sm:p-6">
          <Search className="mx-auto mb-2 h-5 w-5 text-primary" />
          Aucun match officiel trouvé pour cette équipe.
        </div>
      )}

      {!loading && fixtures.length > 0 && (
        <div className="space-y-3">
          {fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              selected={fixture.id === selectedId}
              onClick={() => onSelect(fixture)}
              onAnalyze={() => onAnalyze(fixture)}
              analyzing={analyzing && fixture.id === selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FixtureCard({
  fixture,
  selected,
  onClick,
  onAnalyze,
  analyzing,
}: {
  fixture: Fixture;
  selected: boolean;
  onClick: () => void;
  onAnalyze: () => void;
  analyzing: boolean;
}) {
  const date = new Date(fixture.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? "Date à confirmer"
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "app-hover w-full cursor-pointer rounded-lg border bg-[linear-gradient(135deg,hsl(var(--background)/0.52),hsl(var(--card)/0.38))] p-3.5 text-left sm:p-4",
        selected ? "border-primary/60 bg-primary/10 shadow-glow" : "border-border/80",
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)_130px] lg:items-center">
        <div className="min-w-0 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">{dateLabel}</div>
          <div>{timeLabel}</div>
          {fixture.leagueName && <div className="mt-1 truncate">{fixture.leagueName}</div>}
          {fixture.status === "finished" && (
            <div className="mt-2 inline-flex rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-soft">
              Terminé
            </div>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <TeamSide team={fixture.home} align="right" />
          <span className="min-w-10 text-center text-xs font-extrabold text-muted-foreground">
            {fixture.status === "finished" && fixture.goalsHome != null && fixture.goalsAway != null
              ? `${fixture.goalsHome}-${fixture.goalsAway}`
              : "VS"}
          </span>
          <TeamSide team={fixture.away} align="left" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze();
          }}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-4 text-sm font-extrabold text-primary-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.16)] transition hover:scale-[1.01] hover:opacity-95 sm:w-auto"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {fixture.status === "finished" ? "Résumé" : "Analyser"}
        </button>
      </div>
    </article>
  );
}

function TeamSide({ team, align }: { team: TeamRef; align: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", align === "right" ? "justify-end text-right" : "justify-start")}>
      {align === "right" && <span className="min-w-0 truncate font-semibold">{team.name}</span>}
      <TeamLogo team={team} size={28} />
      {align === "left" && <span className="min-w-0 truncate font-semibold">{team.name}</span>}
    </div>
  );
}

function TeamLogo({ team, size = 34 }: { team: TeamRef; size?: number }) {
  if (!team.logo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {team.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={team.logo}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function CrestPulse({ team }: { team: TeamRef | null }) {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span className="ripple-ring absolute inset-0 rounded-full border border-primary/40" />
      <span className="ripple-ring absolute inset-0 rounded-full border border-primary/30" style={{ animationDelay: "0.9s" }} />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
        {team ? <TeamLogo team={team} size={34} /> : <span className="text-sm font-bold text-foreground/80">?</span>}
      </div>
    </div>
  );
}
