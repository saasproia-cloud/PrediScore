// Mockup téléphone animé (style PrediScore) — écran d'analyse + écussons qui
// flottent autour. Animations CSS (robustes, pas de JS).

import Image from "next/image";
import { Bell, CheckCircle2, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { teamLogo } from "@/lib/football/leagues";

function FloatingCrest({
  id,
  className,
  delay,
  size = 56,
}: {
  id: number;
  className: string;
  delay: string;
  size?: number;
}) {
  return (
    <div
      className={`absolute z-20 flex items-center justify-center rounded-2xl border border-border/70 bg-card/80 shadow-glow backdrop-blur animate-float ${className}`}
      style={{ width: size, height: size, animationDelay: delay }}
    >
      <Image src={teamLogo(id)} alt="" width={size - 22} height={size - 22} className="object-contain" />
    </div>
  );
}

export function PhoneMockup() {
  return (
    <div className="relative mx-auto h-[620px] w-[300px]">
      {/* lueur derrière le téléphone */}
      <div className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      {/* écussons flottants */}
      <FloatingCrest id={85} className="-left-12 top-16" delay="0s" />
      <FloatingCrest id={541} className="-right-10 top-8" delay="1.2s" size={60} />
      <FloatingCrest id={529} className="-left-10 bottom-28" delay="0.6s" size={62} />
      <FloatingCrest id={49} className="-right-12 bottom-24" delay="1.8s" />
      <FloatingCrest id={157} className="right-16 -bottom-4" delay="0.9s" size={50} />

      <div className="absolute -right-20 top-28 z-30 hidden w-52 rounded-2xl border border-primary/25 bg-[#0a0a0a]/95 p-3 text-left shadow-[0_18px_60px_-12px_hsl(var(--primary)/0.35)] backdrop-blur md:block">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-primary">
          <Bell className="h-3.5 w-3.5" />
          Alerte PrediScore
        </div>
        <p className="text-xs leading-snug text-white/82">
          Ton angle <span className="font-bold text-gold-soft">Over 2,5</span> est passé en signal fort.
        </p>
        <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
          <span>Confiance 82/100</span>
          <span className="text-primary">validé</span>
        </div>
      </div>

      {/* châssis */}
      <div className="relative h-full w-full overflow-hidden rounded-[2.6rem] border-[6px] border-[#161616] bg-[#080808] shadow-2xl">
        {/* encoche */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

        <div className="flex h-full flex-col px-4 pb-4 pt-8">
          {/* barre app */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Image src="/brand/prediscore-mark-transparent-trimmed.png" alt="" width={22} height={22} className="h-5 w-5 object-contain" />
              <span className="text-sm font-bold">PrediScore</span>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
              LIVE
            </div>
          </div>

          <div className="mb-3 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] to-gold/[0.08] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">Verdict IA</span>
              <span className="rounded-full bg-primary/[0.15] px-2 py-0.5 text-[9px] font-bold text-primary">82/100</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <TeamMini id={42} name="Arsenal" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-brand-soft">2-1</div>
                <div className="text-[8px] uppercase text-muted-foreground">score modèle</div>
              </div>
              <TeamMini id={40} name="Liverpool" />
            </div>
          </div>

          {/* carte match */}
          <div className="rounded-xl border border-border bg-card/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Probabilités
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="space-y-2">
              <Probability label="Arsenal" value="63%" width="63%" tone="primary" />
              <Probability label="Match nul" value="20%" width="20%" tone="muted" />
              <Probability label="Liverpool" value="18%" width="18%" tone="gold" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Insight icon={<Target className="h-3.5 w-3.5" />} title="Buteur" value="Saka" detail="31%" />
            <Insight icon={<ShieldCheck className="h-3.5 w-3.5" />} title="Marché" value="+2,5 buts" detail="signal fort" />
          </div>

          <div className="mt-3 rounded-xl border border-border bg-card/70 p-3">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold">Résumé du modèle</span>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Arsenal garde l'avantage à domicile, Liverpool reste dangereux en transition.
              Le modèle privilégie un match ouvert avec but des deux côtés.
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">Prochains matchs</div>
            <div className="space-y-2 text-[10px]">
              <NextLine home="PSG" away="Marseille" signal="Over 2,5" />
              <NextLine home="Real Madrid" away="Barça" signal="BTTS" />
            </div>
          </div>

          <div className="mt-auto flex h-9 items-center justify-center rounded-xl bg-brand-gradient text-[11px] font-extrabold text-primary-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.22)]">
            Ouvrir l'analyse complète
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamMini({ id, name }: { id: number; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Image src={teamLogo(id)} alt="" width={30} height={30} className="h-8 w-8 object-contain" />
      <span className="max-w-[70px] truncate text-[9px] font-bold">{name}</span>
    </div>
  );
}

function Probability({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: string;
  tone: "primary" | "muted" | "gold";
}) {
  const color = tone === "gold" ? "bg-gold" : tone === "muted" ? "bg-white/35" : "bg-primary";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="text-white/[0.78]">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

function Insight({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="truncate text-xs font-extrabold">{value}</div>
      <div className="mt-0.5 truncate text-[9px] text-primary">{detail}</div>
    </div>
  );
}

function NextLine({ home, away, signal }: { home: string; away: string; signal: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-background/[0.35] px-2 py-1.5">
      <span className="truncate text-white/[0.78]">
        {home} – {away}
      </span>
      <span className="shrink-0 rounded bg-primary/[0.15] px-1.5 py-0.5 font-bold text-primary">{signal}</span>
    </div>
  );
}
