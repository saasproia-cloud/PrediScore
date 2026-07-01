import Image from "next/image";
import { cn } from "@/lib/utils";

type Team = { name: string; logo?: string };

// Carte de prédiction — équivalent « prédiction pure » du ticket de paris Kickly :
// match, score probable, barres de probabilités, niveau de confiance.
export function PredictionTicket({
  home,
  away,
  score,
  outcome,
  confidence = 78,
  className,
  featured = false,
}: {
  home: Team;
  away: Team;
  score: { home: number; away: number };
  outcome: { home: number; draw: number; away: number };
  confidence?: number;
  className?: string;
  featured?: boolean;
}) {
  const toPct = (v: number) => Math.round(v * 100);
  const rows = [
    { label: home.name, value: toPct(outcome.home), tone: "primary" as const },
    { label: "Match nul", value: toPct(outcome.draw), tone: "muted" as const },
    { label: away.name, value: toPct(outcome.away), tone: "gold" as const },
  ];

  return (
    <div
      className={cn(
        "w-[290px] shrink-0 rounded-2xl border p-4 backdrop-blur-xl",
        featured
          ? "border-primary/40 bg-[#0c0c0c] shadow-[0_28px_80px_-24px_hsl(var(--primary)/0.5)]"
          : "border-white/10 bg-[#0a0a0a]/90 shadow-[0_24px_70px_-28px_rgb(0_0_0/0.9)]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Analyse prête
        </span>
        <span className="text-[10px] font-bold text-gold">Confiance {confidence}%</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
        <TeamSide team={home} />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-white">
            {score.home}
            <span className="mx-1 text-white/40">–</span>
            {score.away}
          </div>
          <div className="text-[8px] uppercase tracking-wide text-muted-foreground">score probable</div>
        </div>
        <TeamSide team={away} />
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="truncate pr-2 text-white/75">{r.label}</span>
              <span className="font-bold text-white">{r.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full",
                  r.tone === "gold" ? "bg-gold" : r.tone === "muted" ? "bg-white/35" : "bg-primary",
                )}
                style={{ width: `${r.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSide({ team }: { team: Team }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      {team.logo ? (
        <Image src={team.logo} alt="" width={30} height={30} unoptimized className="h-8 w-8 object-contain" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
          {team.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="max-w-[74px] truncate text-[10px] font-bold text-white/85">{team.name}</span>
    </div>
  );
}
