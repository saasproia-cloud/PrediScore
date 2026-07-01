import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { TeamRef } from "@/types/football";
import { LEAGUES } from "@/lib/football/leagues";
import { CountUp } from "@/components/marketing/count-up";

// Section « Toute la Coupe du Monde couverte » — score démo réel du modèle,
// fond photo (terrain de nuit), chiffres animés.
export function MatchShowcase({
  home,
  away,
  outcome,
  score,
  t,
}: {
  home: TeamRef;
  away: TeamRef;
  outcome: { home: number; draw: number; away: number };
  score: { home: number; away: number };
  t: {
    title: string;
    demo: string;
    subtitle: string;
    winLabel: string;
    draw: string;
    cta: string;
    footnote: string;
  };
}) {
  const leagues = LEAGUES.filter((l) => [39, 140, 135, 78, 61, 2].includes(l.id));
  const win = (name: string) => t.winLabel.replace("{team}", name);

  return (
    <section id="coupe-du-monde" className="relative isolate overflow-hidden bg-background">
      <ShowcaseBg />

      <div className="relative z-10 mx-auto flex min-h-[720px] max-w-6xl flex-col items-center justify-center px-5 pb-24 pt-32 text-center">
        <h2 className="display-title text-[clamp(2.4rem,6vw,5.2rem)] text-display-green text-glow">
          {t.title}
        </h2>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 opacity-90">
          {leagues.map(
            (l) =>
              l.logo && (
                <Image
                  key={l.id}
                  src={l.logo}
                  alt={l.name}
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                />
              ),
          )}
        </div>

        <div className="mt-12 flex items-center justify-center gap-4">
          <TeamBlock team={home} />
          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-bold uppercase text-white/55">
            {t.demo}
          </span>
          <TeamBlock team={away} />
        </div>

        <h3 className="display-title mx-auto mt-5 max-w-[980px] text-[clamp(2rem,4.6vw,4.4rem)] text-white">
          {home.name} {score.home} <span className="text-primary">–</span> {score.away} {away.name}
        </h3>

        <p className="mx-auto mt-6 max-w-2xl text-base font-medium text-white/80 sm:text-lg">
          {t.subtitle}
        </p>

        <div className="mt-9 grid w-full max-w-3xl grid-cols-3 gap-4">
          <Stat value={outcome.home} label={win(home.name)} tone="home" />
          <Stat value={outcome.draw} label={t.draw} tone="draw" />
          <Stat value={outcome.away} label={win(away.name)} tone="away" />
        </div>

        <Link
          href={`/connexion?next=${encodeURIComponent(`/app?team=${encodeURIComponent(home.name)}&teamId=${home.id}`)}`}
          className="mt-10 inline-flex h-14 items-center gap-3 rounded-full bg-primary px-8 text-base font-extrabold uppercase text-primary-foreground shadow-[0_16px_50px_-12px_hsl(var(--primary)/0.6)] transition hover:opacity-95"
        >
          <CheckCircle2 className="h-5 w-5" />
          {t.cta}
        </Link>

        <p className="mt-6 max-w-sm text-sm font-medium text-brand-soft">{t.footnote}</p>
      </div>
    </section>
  );
}

// Décor — vraie photo d'un terrain de nuit, assombrie + fondus vers le fond.
function ShowcaseBg() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <Image src="/pitch.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-black/[0.62]" />
      <div className="absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,hsl(var(--background)),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,hsl(var(--background)))]" />
      <div className="absolute inset-0 bg-[radial-gradient(72%_60%_at_50%_44%,hsl(0_0%_0%/0.5),transparent_78%)]" />
      <div className="blob-emerald absolute left-1/2 top-[-4%] h-[380px] w-[560px] -translate-x-1/2 rounded-full blur-3xl opacity-20" />
      <div className="blob-gold absolute right-[8%] top-[24%] h-[240px] w-[240px] rounded-full blur-3xl opacity-[0.16]" />
    </div>
  );
}

function TeamBlock({ team }: { team: TeamRef }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {team.logo && (
        <Image
          src={team.logo}
          alt={team.name}
          width={72}
          height={72}
          unoptimized
          className="h-10 w-10 object-contain drop-shadow-[0_0_22px_hsl(var(--primary)/0.34)] sm:h-12 sm:w-12"
        />
      )}
      <span className="hidden text-xs font-extrabold uppercase text-white/[0.78] sm:block">
        {team.name}
      </span>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "home" | "draw" | "away";
}) {
  const pct = value * 100;
  const decimals = pct >= 9.95 ? 0 : 1;
  const color = tone === "away" ? "text-gold" : tone === "draw" ? "text-white" : "text-primary";
  return (
    <div>
      <div className={`text-4xl font-extrabold sm:text-6xl ${color}`}>
        <CountUp end={pct} decimals={decimals} duration={1600} />
        <span className="text-2xl sm:text-3xl">%</span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-white/80">{label}</div>
    </div>
  );
}
