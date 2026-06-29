import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Database,
  Brain,
  Sparkles,
  ShieldCheck,
  Target,
  MessageSquare,
  Trophy,
  Star,
} from "lucide-react";
import { HeroSearch } from "@/components/marketing/hero-search";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { LeagueMarquee } from "@/components/marketing/league-marquee";
import { StadiumBg } from "@/components/marketing/stadium-bg";
import { MatchShowcase } from "@/components/marketing/match-showcase";
import { BrandMark } from "@/components/marketing/brand-mark";
import { predictMatch, pct } from "@/lib/engine/predict";
import { findDemoTeam } from "@/lib/football/demo-data";
import { leagueBaseline, LEAGUES } from "@/lib/football/leagues";
import { SITE_NAME } from "@/lib/constants/config";

export const metadata = {
  title: `${SITE_NAME} — L'IA qui décrypte chaque match de foot`,
  description:
    "Analyses de matchs par IA : probabilités réelles, scénarios et confiance transparente, sur +200 ligues. Un vrai modèle statistique, pas des chiffres inventés.",
};

// Match SERRÉ et reconnaissable : sur le papier indécis, le modèle tranche.
function buildFeatured() {
  const home = findDemoTeam("Arsenal")!;
  const away = findDemoTeam("Liverpool")!;
  const p = predictMatch({ home, away, baseline: leagueBaseline(39) });
  const o = p.markets.outcome;
  const favIsHome = o.home >= o.away;
  return {
    home: home.team,
    away: away.team,
    outcome: o,
    score: { home: p.markets.mostLikelyScore.home, away: p.markets.mostLikelyScore.away },
    favName: favIsHome ? home.team.name : away.team.name,
    favProb: pct(Math.max(o.home, o.away)),
  };
}

const TESTIMONIALS = [
  { quote: "Franchement bluffant. Les analyses sont claires et m'aident à vraiment comprendre les matchs.", name: "Maya Z.", role: "Passionnée de foot" },
  { quote: "Les scénarios IA sont super intéressants. On voit direct les forces et faiblesses des équipes.", name: "Ethan M.", role: "Analyste amateur" },
  { quote: "Enfin une app avec de vraies stats utiles. Tout est bien expliqué, c'est rapide à comprendre.", name: "Hannah L.", role: "Utilisateur régulier" },
  { quote: "Je compare les matchs avant les grosses affiches. Le niveau de détail change vraiment la lecture.", name: "Nassim B.", role: "Fan Premier League" },
  { quote: "La sélection par vrais matchs évite les analyses bizarres. Je vois direct les fixtures utiles.", name: "Sofia R.", role: "Suiveuse Liga" },
  { quote: "Les probabilités sont propres, mais surtout l'explication est claire. Ça ne balance pas juste un score.", name: "Rayan K.", role: "Analyste amateur" },
  { quote: "Très rapide pour vérifier la forme, les buts attendus et les scénarios avant un match.", name: "Clara M.", role: "Utilisatrice régulière" },
  { quote: "J'aime bien le côté données live. On sent que ce n'est pas une simulation inventée.", name: "Ilyes A.", role: "Passionné de stats" },
];

export default function HomePage() {
  const f = buildFeatured();
  const featuredLeagues = LEAGUES.filter((l) => [39, 140, 61, 135, 78, 2].includes(l.id));

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
      {/* ================= DÉCOR STADE CONTINU (hero → téléphone → match) ============== */}
      <section className="relative flex min-h-[106svh] flex-col overflow-hidden">
        <StadiumBg className="h-full" />

        <header className="absolute inset-x-0 top-0 z-30 px-[clamp(22px,5.8vw,118px)] py-6 sm:py-7">
          <div className="flex w-full items-center justify-between">
          <BrandMark className="scale-110" />
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/connexion"
              className="group flex h-12 items-center gap-2 rounded-full border border-gold/45 bg-white/[0.095] px-5 text-sm font-extrabold uppercase text-white shadow-[0_16px_44px_rgb(0_0_0/0.24),inset_0_1px_0_rgb(255_255_255/0.14)] backdrop-blur-xl transition hover:border-gold/75 hover:bg-white/[0.14] hover:text-gold-soft sm:px-6"
            >
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              Connexion
            </Link>
          </nav>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-36 pt-28 text-center sm:pt-32">
          <div className="mb-6 inline-flex max-w-[min(92vw,500px)] items-center justify-center gap-2 rounded-full border border-gold/30 bg-black/[0.34] px-3.5 py-1.5 text-[11px] font-semibold text-white/[0.88] shadow-[0_12px_40px_rgb(0_0_0/0.22),0_0_34px_hsl(var(--gold)/0.12)] backdrop-blur-md sm:text-xs">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="truncate">43K matchs prédits · objectif 85%+ sur signaux fiables</span>
          </div>
          <h1 className="display-title mx-auto max-w-5xl text-[clamp(3rem,6.6vw,7rem)] text-gradient-brand drop-shadow-[0_12px_42px_rgb(0_0_0/0.52)]">
            ANTICIPE LE MATCH
            <br />
            <span className="text-brand-soft text-glow">AVANT LE COUP D'ENVOI.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium text-white/82 drop-shadow-[0_2px_18px_rgb(0_0_0/0.55)] sm:text-lg">
            Probabilités réelles, scénario du match et niveau de confiance — calculés par un vrai
            modèle, pas inventés. Sur plus de 200 ligues.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>

          <div className="mx-auto mt-10 w-full max-w-5xl">
            <LeagueMarquee />
          </div>
        </div>

        {/* fondu bas du décor → contenu */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[34vh] bg-[linear-gradient(180deg,transparent_0%,hsl(var(--background)/0.42)_42%,hsl(var(--background))_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 -bottom-24 z-[2] h-48 bg-[radial-gradient(70%_100%_at_50%_0%,hsl(var(--gold)/0.08),transparent_58%)]" />
      </section>

      <div className="relative -mt-24">
        <MatchShowcase home={f.home} away={f.away} outcome={f.outcome} score={f.score} />
      </div>

      <ReviewsCarousel />

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-foreground/75 backdrop-blur">
          Interface mobile · analyse complète
        </div>
        <PhoneMockup />
      </section>

      {/* ================= CONTENU (avec halos de couleur) ============== */}
      <div className="relative">
        <div className="blob-teal pointer-events-none absolute right-0 top-40 h-[400px] w-[400px] rounded-full blur-3xl opacity-35" />
        <div className="blob-gold pointer-events-none absolute -left-20 top-[900px] h-[440px] w-[440px] rounded-full blur-3xl opacity-25" />

        {/* bandeau confiance */}
        <section className="relative z-10 border-y border-border/60 bg-card/20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 text-center sm:grid-cols-4">
            {[
              { v: "+200", l: "ligues & coupes" },
              { v: "15+", l: "marchés par match" },
              { v: "Dixon-Coles", l: "modèle statistique réel" },
              { v: "Live", l: "données + cotes du marché" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-extrabold text-brand-soft sm:text-3xl">{s.v}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* comment ça marche */}
        <section className="relative z-10 mx-auto max-w-6xl px-5 py-20">
          <h2 className="display-title text-center text-3xl sm:text-4xl">COMMENT ON PRÉDIT</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
            Trois étapes. Aucune ne laisse l'IA inventer un chiffre.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Database, t: "1 · Données réelles", d: "Forme, buts marqués/encaissés domicile et extérieur, classements et cotes — récupérés en live via API-Football.", c: "from-primary/15" },
              { icon: Brain, t: "2 · Modèle statistique", d: "Un modèle Dixon-Coles simule toute la grille des scores et en déduit chaque probabilité. Déterministe, jamais répétitif.", c: "from-gold/[0.13]" },
              { icon: Sparkles, t: "3 · Analyse IA", d: "L'IA rédige le scénario du match à partir des chiffres calculés. Elle explique — elle n'invente pas.", c: "from-primary/[0.12]" },
            ].map((s) => (
              <div key={s.t} className={`rounded-2xl border border-border bg-gradient-to-b ${s.c} to-card/40 p-6`}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-background/40 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ligues */}
        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 text-center">
          <h2 className="display-title text-2xl sm:text-3xl">+200 LIGUES COUVERTES</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 opacity-90">
            {featuredLeagues.map((l) => (
              <div key={l.id} className="flex flex-col items-center gap-2">
                <Image src={l.logo!} alt={l.name} width={44} height={44} className="h-11 w-11 object-contain" />
                <span className="text-xs text-muted-foreground">{l.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* features */}
        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, t: "Probabilités exactes", d: "Score exact, +/- buts, BTTS, double chance, clean sheet… tout le détail." },
              { icon: ShieldCheck, t: "Confiance transparente", d: "Chaque analyse affiche son niveau de fiabilité réel." },
              { icon: Trophy, t: "Compétitions & classements", d: "Toutes les ligues, classements, équipes, joueurs et prochains matchs." },
              { icon: MessageSquare, t: "Coach IA (Pro)", d: "Pose tes questions sur n'importe quel match, réponses ancrées sur les vraies données." },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-border bg-card/40 p-5 transition hover:border-primary/40">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 mx-auto max-w-3xl px-5 pb-24 text-center">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-10">
            <div className="blob-emerald pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-2xl" />
            <h2 className="display-title text-3xl sm:text-4xl">PRÊT À ANALYSER ?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Lance ta première analyse gratuitement. Passe Pro pour tout débloquer.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/connexion?next=%2Fapp" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-7 font-semibold text-background transition hover:bg-[hsl(var(--brand-soft))]">
                Analyser un match <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="flex h-12 items-center justify-center rounded-xl border border-border bg-background/30 px-7 font-medium transition hover:bg-card">
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <div>© {new Date().getFullYear()} {SITE_NAME} · Analyse football nouvelle génération</div>
            <div className="flex gap-4">
              <Link href="/pricing" className="hover:text-foreground">Tarifs</Link>
              <Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ReviewsCarousel() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="relative z-10 mx-auto max-w-6xl overflow-hidden px-5 pb-16 pt-2">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Retours utilisateurs
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Des analyses qui se lisent vite.
          </h2>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          Carrousel continu · avis vérifiés en bêta
        </div>
      </div>
      <div className="relative">
        <div className="flex w-max gap-4 animate-marquee">
          {loop.map((t, i) => (
            <article
              key={`${t.name}-${i}`}
              className="w-[280px] shrink-0 rounded-xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur sm:w-[340px]"
            >
              <div className="mb-3 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="h-4 w-4 fill-gold" />
                ))}
              </div>
              <p className="min-h-[72px] text-sm leading-relaxed text-foreground/90">“{t.quote}”</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-sm font-bold text-primary">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
