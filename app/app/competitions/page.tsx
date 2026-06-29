import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Trophy } from "lucide-react";
import { LEAGUES } from "@/lib/football/leagues";

export const metadata = { title: "Compétitions" };

export default function CompetitionsPage() {
  const cups = LEAGUES.filter((l) => l.kind === "cup" && l.id !== 1);
  const leagues = LEAGUES.filter((l) => l.kind === "league");
  const worldCup = LEAGUES.find((l) => l.id === 1)!;

  return (
    <div>
      <header className="app-panel mb-5 rounded-lg p-4 text-left sm:mb-6 sm:p-5 sm:text-center">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Compétitions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Classements, équipes et prochains matchs — analysés par l'IA.
        </p>
      </header>

      {/* Coupe du monde — édition dédiée */}
      <Link
        href="/app/world-cup"
        className="app-hover mb-6 flex items-center gap-3 rounded-lg border border-gold/30 bg-[radial-gradient(circle_at_12%_12%,hsl(var(--gold)/0.18),transparent_36%),linear-gradient(135deg,rgba(28,24,8,0.82),rgba(8,25,20,0.74))] p-4 sm:gap-4 sm:p-5"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/[0.15] text-2xl">🌍</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{worldCup.name}</span>
            <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-soft">
              ÉDITION DÉDIÉE
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Favoris, parcours probables, forces et faiblesses par équipe</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      <Group title="Coupes" items={cups} />
      <Group title="Championnats" items={leagues} />
    </div>
  );
}

function Group({ title, items }: { title: string; items: typeof LEAGUES }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" /> {title}
      </h2>
      <div className="space-y-2">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/app/competition/${l.id}`}
            className="app-hover flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card/50 p-3"
          >
            {l.logo ? (
              <Image src={l.logo} alt={l.name} width={32} height={32} className="h-8 w-8 object-contain" />
            ) : (
              <div className="h-8 w-8 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{l.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {l.flag} {l.country} · {l.season}/{l.season + 1}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
