import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { TeamRef } from "@/types/football";

const f = (p: number) => {
  const v = p * 100;
  return v >= 9.95 ? `${Math.round(v)}` : v.toFixed(1);
};

export function MatchShowcase({
  home,
  away,
  outcome,
  score,
}: {
  home: TeamRef;
  away: TeamRef;
  outcome: { home: number; draw: number; away: number };
  score: { home: number; away: number };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[#050914] shadow-[inset_0_120px_130px_rgb(0_0_0/0.18),inset_0_-90px_110px_rgb(0_0_0/0.36)]">
      <Image
        src="/pitch.jpg"
        alt=""
        fill
        sizes="100vw"
        className="absolute inset-0 -z-30 scale-[1.03] object-cover object-center opacity-86 contrast-[1.04] saturate-[1.08]"
      />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(60%_58%_at_50%_45%,hsl(var(--primary)/0.25),transparent_62%),radial-gradient(34%_34%_at_50%_28%,hsl(var(--gold)/0.18),transparent_64%),linear-gradient(90deg,hsl(166_52%_4%/0.88),hsl(164_38%_7%/0.52)_34%,hsl(164_38%_7%/0.52)_66%,hsl(166_52%_4%/0.88))]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,hsl(var(--background)/0.02)_0%,hsl(164_48%_5%/0.26)_20%,transparent_44%,hsl(164_48%_5%/0.78)_100%)]" />
      <div className="absolute inset-x-0 top-0 z-0 h-64 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background)/0.82)_28%,hsl(var(--background)/0.26)_70%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 z-0 h-40 bg-[radial-gradient(64%_100%_at_50%_0%,hsl(var(--gold)/0.11),transparent_68%)]" />

      <div className="pointer-events-none absolute bottom-0 left-[clamp(-52px,1.8vw,44px)] z-0 hidden h-[66%] w-[clamp(220px,18vw,360px)] xl:block">
        <div className="absolute bottom-[-20px] left-8 h-28 w-[78%] rounded-[50%] bg-black/78 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-[#050914] via-[#050914]/78 to-transparent" />
        <Image
          src="/player-arsenal-crop.png"
          alt=""
          width={760}
          height={1024}
          className="relative h-full w-full object-contain object-bottom opacity-90 drop-shadow-[0_30px_52px_rgb(0_0_0/0.72)] [mask-image:linear-gradient(to_bottom,black_0%,black_84%,transparent_100%)]"
        />
      </div>
      <div className="pointer-events-none absolute bottom-0 right-[clamp(-46px,2vw,52px)] z-0 hidden h-[67%] w-[clamp(220px,18vw,360px)] xl:block">
        <div className="absolute bottom-[-20px] right-8 h-28 w-[78%] rounded-[50%] bg-black/78 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-40 w-full bg-gradient-to-t from-[#050914] via-[#050914]/78 to-transparent" />
        <Image
          src="/player-liverpool.webp"
          alt=""
          width={625}
          height={925}
          className="relative h-full w-full object-contain object-bottom opacity-90 drop-shadow-[0_30px_52px_rgb(0_0_0/0.72)] [mask-image:linear-gradient(to_bottom,black_0%,black_84%,transparent_100%)]"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-6xl flex-col items-center justify-center px-5 pb-24 pt-36 text-center sm:min-h-[820px]">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
            Plus de 200 ligues couvertes
          </p>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-5 opacity-90 sm:gap-8">
          {["LIGUE 1", "Premier League", "SERIE A", "LALIGA"].map((name) => (
            <span key={name} className="text-base font-extrabold uppercase tracking-tight text-white/[0.78] sm:text-xl">
              {name}
            </span>
          ))}
        </div>

        <div className="mb-8 w-full max-w-5xl">
          <div className="mb-4 flex items-center justify-center gap-5 sm:gap-8">
            <TeamBlock team={home} />
            <div className="rounded-full border border-white/12 bg-black/24 px-3 py-1 text-xs font-bold uppercase text-white/54">
              Démo modèle
            </div>
            <TeamBlock team={away} />
          </div>
          <h2 className="display-title mx-auto max-w-[980px] text-[clamp(2.2rem,4.6vw,5rem)] leading-[0.96] text-brand-soft">
            {home.name} {score.home} - {score.away} {away.name}
          </h2>
        </div>

        <p className="mx-auto max-w-2xl text-base font-semibold leading-relaxed text-white/88 sm:text-lg">
          Des millions de données football analysées à partir de plus de 220 sources pour
          prédire chaque match avec une lecture claire du modèle.
        </p>

        <div className="mt-9 grid w-full max-w-3xl grid-cols-3 gap-4 text-center">
          <Stat value={f(outcome.home)} label={`Victoire ${home.name}`} tone="home" />
          <Stat value={f(outcome.draw)} label="Match nul" tone="draw" />
          <Stat value={f(outcome.away)} label={`Victoire ${away.name}`} tone="away" />
        </div>

        <Link
          href={`/connexion?next=${encodeURIComponent(`/app?team=${encodeURIComponent(home.name)}&teamId=${home.id}`)}`}
          className="mt-10 inline-flex h-12 items-center gap-3 rounded-full bg-brand-gradient px-8 text-base font-extrabold uppercase text-primary-foreground shadow-glow transition hover:opacity-95"
        >
          <CheckCircle2 className="h-5 w-5" />
          Analyse prête
        </Link>

        <p className="mt-6 max-w-sm text-sm font-medium text-brand-soft">
          Lance l'analyse dans l'app pour obtenir tous les détails du match.
        </p>
      </div>
    </section>
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
      <span className="hidden text-xs font-extrabold uppercase text-white/[0.78] sm:block">{team.name}</span>
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: "home" | "draw" | "away" }) {
  const color = tone === "away" ? "text-gold" : tone === "draw" ? "text-white" : "text-brand-soft";
  return (
    <div>
      <div className={`text-4xl font-extrabold sm:text-6xl ${color}`}>
        {value}<span className="text-2xl sm:text-3xl">%</span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-white/80">{label}</div>
    </div>
  );
}
