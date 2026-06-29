import Link from "next/link";
import { ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";

const POINTS = [
  "Analyses de match sauvegardées",
  "Abonnement et quotas synchronisés",
  "Coach IA disponible selon ton plan",
];

// Panneau gauche de la page de connexion — ambiance prediscore.
// Visible à partir de lg ; sur mobile, le formulaire prend tout l'écran.
export function WorldCupPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_82%_12%,hsl(var(--gold)/0.12),transparent_32%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--secondary)/0.55))]" />
      <div className="pitch-lines pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative z-10">
        <BrandMark href="/" />
      </div>

      <div className="relative z-10 max-w-md">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Trophy className="size-3.5" /> Coupe du Monde 2026
        </div>
        <h2 className="display-title text-4xl leading-tight xl:text-5xl">
          Le monde regarde les <span className="text-gradient">matchs</span>.
          <br />
          Toi, tu les lis avant.
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Crée ton compte pour sauvegarder tes analyses, gérer ton abonnement et
          poser tes questions au Coach IA.
        </p>

        <ul className="mt-7 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm text-foreground/90">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground/70">
        <ShieldCheck className="size-3.5" />
        Inscription gratuite — accès premium vérifié côté serveur.{" "}
        <Link href="/" className="underline-offset-4 hover:underline">
          Retour
        </Link>
      </p>
    </aside>
  );
}
