"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";

export interface DemoAnalysisProps {
  home: { name: string; logo?: string };
  away: { name: string; logo?: string };
  outcome: { home: number; draw: number; away: number };
  score: { home: number; away: number };
  over25: number;
  btts: number;
  xg: { home: number; away: number };
  confidenceLabel: string;
  confidenceScore: number;
  scenario: string;
}

const f = (p: number) => {
  const v = p * 100;
  return v >= 9.95 ? `${Math.round(v)}%` : `${v.toFixed(1)}%`;
};

function Crest({ logo, name }: { logo?: string; name: string }) {
  return logo ? (
    <Image src={logo} alt={name} width={44} height={44} className="h-11 w-11 object-contain" />
  ) : (
    <div className="h-11 w-11 rounded-full bg-muted" />
  );
}

export function DemoAnalysis(props: DemoAnalysisProps) {
  const { home, away, outcome, score, over25, btts, xg } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card/70 p-6 shadow-glow backdrop-blur"
    >
      <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Exemple d'analyse en direct
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Crest logo={home.logo} name={home.name} />
          <span className="text-xs font-medium">{home.name}</span>
        </div>
        <div className="text-center">
          <div className="text-4xl font-extrabold text-brand-soft">
            {score.home}–{score.away}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">score probable</div>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Crest logo={away.logo} name={away.name} />
          <span className="text-xs font-medium">{away.name}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { l: home.name, v: outcome.home },
          { l: "Nul", v: outcome.draw },
          { l: away.name, v: outcome.away },
        ].map((x, i) => (
          <div key={i} className="rounded-xl bg-background/50 p-2.5">
            <div className="text-lg font-bold text-brand-soft">{f(x.v)}</div>
            <div className="truncate text-[10px] text-muted-foreground">{x.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-primary" style={{ width: `${outcome.home * 100}%` }} />
        <div className="bg-muted-foreground/50" style={{ width: `${outcome.draw * 100}%` }} />
        <div className="bg-sky-500" style={{ width: `${outcome.away * 100}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg border border-border p-2">
          <div className="font-semibold text-primary">{f(over25)}</div>
          <div className="text-[10px] text-muted-foreground">+2,5 buts</div>
        </div>
        <div className="rounded-lg border border-border p-2">
          <div className="font-semibold text-primary">{f(btts)}</div>
          <div className="text-[10px] text-muted-foreground">2 marquent</div>
        </div>
        <div className="rounded-lg border border-border p-2">
          <div className="font-semibold text-primary">{xg.home}–{xg.away}</div>
          <div className="text-[10px] text-muted-foreground">buts attendus</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-muted-foreground">
          Confiance : <span className="font-semibold text-foreground">{props.confidenceLabel}</span> ({props.confidenceScore}/100)
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{props.scenario}</p>

      <Link
        href={`/connexion?next=${encodeURIComponent(`/app?team=${encodeURIComponent(home.name)}`)}`}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-emerald-400 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
      >
        Voir l'analyse complète
      </Link>
    </motion.div>
  );
}
