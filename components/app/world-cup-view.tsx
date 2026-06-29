"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Crown,
  Lock,
  MapPin,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "groups" | "bracket";

const GROUPS = [
  { name: "Groupe A", teams: [["🇲🇽", "Mexico", 9], ["🇿🇦", "South Africa", 4], ["🇰🇷", "South Korea", 3], ["🇨🇿", "Czechia", 1]] },
  { name: "Groupe B", teams: [["🇨🇭", "Switzerland", 7], ["🇨🇦", "Canada", 4], ["🇧🇦", "Bosnia & Herzegovina", 4], ["🇶🇦", "Qatar", 1]] },
  { name: "Groupe C", teams: [["🇧🇷", "Brazil", 7], ["🇲🇦", "Morocco", 7], ["🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Scotland", 3], ["🇭🇹", "Haiti", 0]] },
  { name: "Groupe D", teams: [["🇺🇸", "USA", 6], ["🇦🇺", "Australia", 4], ["🇵🇾", "Paraguay", 4], ["🇹🇷", "Türkiye", 3]] },
  { name: "Groupe E", teams: [["🇩🇪", "Germany", 6], ["🇨🇮", "Ivory Coast", 6], ["🇪🇨", "Ecuador", 4], ["🇨🇼", "Curaçao", 1]] },
  { name: "Groupe F", teams: [["🇳🇱", "Netherlands", 7], ["🇯🇵", "Japan", 5], ["🇸🇪", "Sweden", 4], ["🇹🇳", "Tunisia", 0]] },
  { name: "Groupe G", teams: [["🇪🇬", "Egypt", 4], ["🇮🇷", "Iran", 2], ["🇧🇪", "Belgium", 2], ["🇳🇿", "New Zealand", 1]] },
  { name: "Groupe H", teams: [["🇪🇸", "Spain", 4], ["🇺🇾", "Uruguay", 2], ["🇨🇻", "Cape Verde", 2], ["🇸🇦", "Saudi Arabia", 1]] },
  { name: "Groupe I", teams: [["🇫🇷", "France", 9], ["🇳🇴", "Norway", 6], ["🇸🇳", "Senegal", 3], ["🇮🇶", "Iraq", 0]] },
  { name: "Groupe J", teams: [["🇦🇷", "Argentina", 7], ["🇩🇰", "Denmark", 5], ["🇯🇲", "Jamaica", 2], ["🇦🇪", "UAE", 1]] },
  { name: "Groupe K", teams: [["🇵🇹", "Portugal", 7], ["🇨🇴", "Colombia", 6], ["🇵🇱", "Poland", 3], ["🇵🇦", "Panama", 1]] },
  { name: "Groupe L", teams: [["🏴", "England", 9], ["🇭🇷", "Croatia", 4], ["🇬🇭", "Ghana", 4], ["🇳🇿", "New Zealand", 0]] },
];

const BRACKET = [
  ["🇿🇦 South Africa", "🇨🇦 Canada"],
  ["🇩🇪 Germany", "3rd of ABCDE"],
  ["🇳🇱 Netherlands", "🇲🇦 Morocco"],
  ["🇧🇷 Brazil", "🇯🇵 Japan"],
  ["🇫🇷 France", "3rd of CDFGH"],
  ["🇨🇮 Ivory Coast", "🇳🇴 Norway"],
  ["🇲🇽 Mexico", "3rd of IJKL"],
  ["🇨🇭 Switzerland", "🇦🇺 Australia"],
  ["🇺🇸 USA", "🇵🇾 Paraguay"],
  ["🇪🇸 Spain", "🇸🇳 Senegal"],
  ["🇦🇷 Argentina", "🇭🇷 Croatia"],
  ["🇵🇹 Portugal", "🇩🇰 Denmark"],
  ["🏴 England", "🇨🇴 Colombia"],
  ["🇺🇾 Uruguay", "🇸🇪 Sweden"],
  ["🇧🇪 Belgium", "🇬🇭 Ghana"],
  ["🇪🇬 Egypt", "🇮🇷 Iran"],
];

export function WorldCupView() {
  const [view, setView] = useState<View>("groups");

  return (
    <div className="space-y-5 sm:space-y-7">
      <Link href="/app/competitions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux compétitions
      </Link>

      <section className="relative overflow-hidden rounded-lg border border-gold/25 bg-[radial-gradient(circle_at_85%_15%,hsl(var(--gold)/0.18),transparent_32%),linear-gradient(135deg,hsl(166_24%_11%/0.95),hsl(162_42%_10%/0.92))] p-5 shadow-[0_22px_70px_rgb(0_0_0/0.24)] sm:p-9">
        <div className="absolute inset-0 opacity-20 pitch-lines" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-black/20 sm:h-20 sm:w-20">
            <Image src="/world-cup-trophy.png" alt="" width={62} height={62} className="h-14 w-14 object-contain opacity-90" />
          </div>
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-soft">
              <Crown className="h-3.5 w-3.5" /> Édition dédiée
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">FIFA World Cup</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> 11 juin – 19 juillet 2026</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> USA · Canada · Mexique</span>
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel-muted rounded-lg p-4 text-center sm:p-6">
        <Lock className="mx-auto mb-3 h-6 w-6 text-primary" />
        <p className="text-sm text-muted-foreground">
          Le top 3 des favoris, les scénarios de parcours et les probabilités de qualification sont réservés aux membres premium.
        </p>
        <Link href="/app/subscription" className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-brand-gradient px-6 text-sm font-extrabold text-primary-foreground transition hover:scale-[1.01]">
          Passer Premium
        </Link>
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input placeholder="Rechercher une équipe..." className="h-12 w-full rounded-lg border border-border bg-card/[0.65] pl-11 pr-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 sm:text-sm" />
      </div>

      <div className="app-panel-muted inline-flex max-w-full overflow-x-auto rounded-lg p-1 text-xs font-semibold">
        <Tab active={view === "groups"} onClick={() => setView("groups")}>Phase de groupes</Tab>
        <Tab active={view === "bracket"} onClick={() => setView("bracket")}>Tableau final</Tab>
      </div>

      {view === "groups" ? <Groups /> : <Bracket />}

      <Link href="/app" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-6 font-semibold text-background transition hover:bg-[hsl(var(--brand-soft))]">
        <Sparkles className="h-4 w-4" /> Analyser un match
      </Link>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-lg px-4 py-2 transition", active ? "bg-primary/[0.15] text-primary" : "text-muted-foreground hover:text-foreground")}
    >
      {children}
    </button>
  );
}

function Groups() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-extrabold tracking-tight">Groupes</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.name} className="app-hover overflow-hidden rounded-lg border border-border bg-card/[0.55]">
            <div className="border-b border-border bg-white/[0.04] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{group.name}</div>
            <div className="divide-y divide-border/70">
              {group.teams.map(([flag, name, pts], index) => (
                <div key={String(name)} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={index < 2 ? "text-primary" : "text-muted-foreground"}>{index + 1}</span>
                  <span>{flag}</span>
                  <span className="flex-1 font-semibold">{name}</span>
                  <span className="text-muted-foreground">{pts}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Bracket() {
  return (
    <section className="app-panel-muted rounded-lg p-3.5 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Tableau à élimination directe</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Trophy className="h-3.5 w-3.5" /> Projection
        </span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[980px] gap-4 lg:grid-cols-4">
          <BracketColumn title="Seizièmes de finale" matches={BRACKET} />
          <BracketColumn title="Huitièmes de finale" matches={[["Winner M74", "Winner M77"], ["Winner M73", "Winner M75"], ["Winner M76", "Winner M78"], ["Winner M79", "Winner M80"], ["Winner M81", "Winner M82"], ["Winner M83", "Winner M84"], ["Winner M85", "Winner M86"], ["Winner M87", "Winner M88"]]} muted />
          <BracketColumn title="Quarts / Demies" matches={[["Winner M89", "Winner M90"], ["Winner M91", "Winner M92"], ["Winner M93", "Winner M94"], ["Winner M95", "Winner M96"], ["Winner M97", "Winner M98"], ["Winner M99", "Winner M100"]]} muted />
          <BracketColumn title="Finale" matches={[["Winner M101", "Winner M102"], ["Winner M103", "Winner M104"]]} muted />
        </div>
      </div>
    </section>
  );
}

function BracketColumn({ title, matches, muted = false }: { title: string; matches: string[][]; muted?: boolean }) {
  return (
    <div>
      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-3">
        {matches.map((match, index) => (
          <div key={`${title}-${index}`} className="overflow-hidden rounded-lg border border-border bg-background/[0.35]">
            {match.map((team) => (
              <div key={team} className="flex items-center gap-2 border-b border-border/70 px-3 py-2 last:border-b-0">
                <span className="h-3.5 w-3.5 rounded bg-primary/10" />
                <span className={muted ? "text-sm italic text-muted-foreground" : "text-sm font-semibold"}>{team}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
