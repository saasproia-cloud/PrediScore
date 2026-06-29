import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { TeamRef } from "@/types/football";

const f = (p: number) => {
  const v = p * 100;
  return v >= 9.95 ? `${Math.round(v)}` : v.toFixed(1);
};

export interface FeaturedMatchProps {
  home: TeamRef;
  away: TeamRef;
  outcome: { home: number; draw: number; away: number };
  score: { home: number; away: number };
}

export function FeaturedMatch({ home, away, outcome, score }: FeaturedMatchProps) {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
        {/* domicile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
            {home.logo && (
              <Image src={home.logo} alt={home.name} width={96} height={96} className="relative h-20 w-20 object-contain sm:h-24 sm:w-24" />
            )}
          </div>
          <span className="text-center text-sm font-bold uppercase tracking-wide sm:text-base">{home.name}</span>
        </div>

        {/* score */}
        <div className="text-center">
          <div className="display-title text-5xl text-brand-soft text-glow sm:text-7xl">
            {score.home}<span className="mx-1 text-muted-foreground">-</span>{score.away}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">démo modèle</div>
        </div>

        {/* extérieur */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl" />
            {away.logo && (
              <Image src={away.logo} alt={away.name} width={96} height={96} className="relative h-20 w-20 object-contain sm:h-24 sm:w-24" />
            )}
          </div>
          <span className="text-center text-sm font-bold uppercase tracking-wide sm:text-base">{away.name}</span>
        </div>
      </div>

      {/* pourcentages */}
      <div className="mt-10 grid grid-cols-3 gap-4 text-center">
        <Stat value={f(outcome.home)} label={`Victoire ${home.name}`} tone="primary" />
        <Stat value={f(outcome.draw)} label="Match nul" tone="muted" />
        <Stat value={f(outcome.away)} label={`Victoire ${away.name}`} tone="sky" />
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href={`/connexion?next=${encodeURIComponent(`/app?team=${encodeURIComponent(home.name)}&teamId=${home.id}`)}`}
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand-gradient px-7 font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
        >
          <CheckCircle2 className="h-5 w-5" /> Analyse prête — voir le détail
        </Link>
      </div>
      <p className="mx-auto mt-3 max-w-md text-center text-[11px] text-muted-foreground">
        Exemple illustratif basé sur le moteur PrediScore. Les analyses réelles dépendent des données disponibles.
      </p>
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: "primary" | "muted" | "sky" }) {
  const color = tone === "primary" ? "text-brand-soft" : tone === "sky" ? "text-gold" : "text-foreground";
  return (
    <div>
      <div className={`text-4xl font-extrabold sm:text-5xl ${color}`}>
        {value}<span className="text-2xl">%</span>
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
