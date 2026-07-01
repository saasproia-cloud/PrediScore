import Link from "next/link";
import {
  ArrowRight,
  Check,
  MessageSquare,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroSearch } from "@/components/marketing/hero-search";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { LeagueMarquee } from "@/components/marketing/league-marquee";
import { StadiumBg } from "@/components/marketing/stadium-bg";
import { MatchShowcase } from "@/components/marketing/match-showcase";
import { PredictionTicket } from "@/components/marketing/prediction-ticket";
import { CountUp } from "@/components/marketing/count-up";
import { RefTracker } from "@/components/marketing/ref-tracker";
import { predictMatch } from "@/lib/engine/predict";
import { findDemoTeam } from "@/lib/football/demo-data";
import { leagueBaseline } from "@/lib/football/leagues";
import { getI18n } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { SITE_NAME } from "@/lib/constants/config";
import { cn } from "@/lib/utils";

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
  return {
    home: home.team,
    away: away.team,
    outcome: o,
    score: { home: p.markets.mostLikelyScore.home, away: p.markets.mostLikelyScore.away },
  };
}

// Vraies prédictions du modèle pour l'éventail de cartes (pas de chiffres inventés).
function buildTickets() {
  const pairs: [string, string, number][] = [
    ["Real Madrid", "Barcelona", 140],
    ["Inter", "AC Milan", 135],
    ["Bayern", "Dortmund", 78],
  ];
  return pairs
    .map(([h, a, lg]) => {
      const home = findDemoTeam(h);
      const away = findDemoTeam(a);
      if (!home || !away) return null;
      const p = predictMatch({ home, away, baseline: leagueBaseline(lg) });
      const o = p.markets.outcome;
      return {
        home: { name: home.team.name, logo: home.team.logo },
        away: { name: away.team.name, logo: away.team.logo },
        score: { home: p.markets.mostLikelyScore.home, away: p.markets.mostLikelyScore.away },
        outcome: o,
        confidence: Math.round(50 + Math.max(o.home, o.away) * 45),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

// Noms des avis (identiques dans toutes les langues) ; les textes viennent du dico.
const REVIEW_NAMES = ["Maya Z.", "Ethan M.", "Hannah L.", "Nassim B.", "Sofia R.", "Rayan K.", "Clara M.", "Ilyes A."];

const SELECTOR = [
  { home: "France", away: "Brésil", probs: [48, 27, 25], pick: 0 },
  { home: "Allemagne", away: "Espagne", probs: [37, 29, 34], pick: 2 },
  { home: "Argentine", away: "Pays-Bas", probs: [53, 25, 22], pick: 0 },
];

const FAN = [
  { deg: -8, dx: -72, dy: 8, z: 10, featured: false },
  { deg: 0, dx: 0, dy: -10, z: 30, featured: true },
  { deg: 8, dx: 72, dy: 22, z: 20, featured: false },
];

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const f = buildFeatured();
  const tickets = buildTickets();

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
      <RefTracker />
      <Navbar locale={locale} nav={t.nav} langLabel={t.langMenu} />

      {/* ============================ HERO ============================ */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <StadiumBg className="h-full" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-28 pt-32 text-center sm:pt-36">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-black/40 px-4 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
            <span className="flex text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-gold" />
              ))}
            </span>
            <span>{t.hero.social}</span>
          </div>

          <h1 className="display-title mx-auto max-w-5xl text-[clamp(2.6rem,6.4vw,6.2rem)] text-white drop-shadow-[0_12px_42px_rgb(0_0_0/0.55)]">
            {t.hero.titleBefore}{" "}
            <span className="text-gold text-glow-gold">{t.hero.titleHighlight}</span>{" "}
            {t.hero.titleAfter}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium text-white/80 drop-shadow-[0_2px_18px_rgb(0_0_0/0.55)] sm:text-lg">
            {t.hero.subtitle}
          </p>

          <div className="mt-9 w-full">
            <HeroSearch
              placeholder={t.hero.searchPlaceholder}
              analyzeLabel={t.hero.analyze}
              analyzeShortLabel={t.hero.analyzeShort}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
            {t.hero.bullets.map((b, i) => (
              <span key={b} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {i === 0 ? (
                  <span>
                    <CountUp end={43} suffix="K" /> {b}
                  </span>
                ) : (
                  b
                )}
              </span>
            ))}
          </div>

          <div className="mx-auto mt-12 w-full max-w-5xl">
            <LeagueMarquee />
          </div>
        </div>
      </section>

      {/* ==================== IA + MOCKUP TÉLÉPHONE ==================== */}
      <section id="fonctionnalites" className="relative overflow-hidden py-24">
        <div className="blob-gold pointer-events-none absolute -left-24 top-10 h-[380px] w-[380px] rounded-full blur-3xl opacity-20" />
        <div className="blob-emerald pointer-events-none absolute -right-20 bottom-0 h-[360px] w-[360px] rounded-full blur-3xl opacity-20" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <Zap className="h-4 w-4 fill-gold" /> {t.ia.badge}
            </p>
            <h2 className="display-title text-[clamp(2.2rem,4.6vw,4rem)] text-white">
              {t.ia.titleBefore} <span className="text-gold">{t.ia.titleHighlight}</span>
            </h2>
            <p className="mt-5 max-w-lg text-base text-white/70">{t.ia.desc}</p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-4">
              {t.ia.stats.map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xl font-extrabold text-primary">{s.v}</div>
                  <div className="mt-0.5 text-xs text-white/60">{s.l}</div>
                </div>
              ))}
            </div>

            <Link
              href="/connexion?next=%2Fapp"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-gold-cta px-7 text-sm font-bold text-gold-foreground shadow-[0_12px_40px_-10px_hsl(var(--gold)/0.6)] transition hover:opacity-95"
            >
              {t.ia.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex justify-center">
            <PhoneMockup t={t.phone} />
          </div>
        </div>
      </section>

      {/* =============== PRÉCISION + ÉVENTAIL DE PRÉDICTIONS =============== */}
      <section className="relative overflow-hidden border-y border-white/10 bg-[#070707] py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 lg:grid-cols-2">
          <div className="relative flex min-h-[380px] items-center justify-center">
            <div className="sm:hidden">
              {tickets[0] && <PredictionTicket {...tickets[0]} labels={t.ticket} featured />}
            </div>
            <div className="relative hidden h-[400px] w-full sm:block">
              {tickets.slice(0, 3).map((ticket, i) => (
                <div
                  key={`${ticket.home.name}-${i}`}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${FAN[i].deg}deg) translate(${FAN[i].dx}px, ${FAN[i].dy}px)`,
                    zIndex: FAN[i].z,
                  }}
                >
                  <PredictionTicket {...ticket} labels={t.ticket} featured={FAN[i].featured} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t.precision.label}
            </p>
            <h2 className="display-title text-[clamp(2rem,4.4vw,3.6rem)] text-white">
              {t.precision.titleBefore}{" "}
              <CountUp end={85} suffix="%+" className="text-primary text-glow" />{" "}
              {t.precision.titleAfter}
            </h2>
            <p className="mt-5 max-w-lg text-base text-white/70">{t.precision.desc}</p>
            <Link
              href="/connexion?next=%2Fapp"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground shadow-[0_12px_40px_-10px_hsl(var(--primary)/0.6)] transition hover:opacity-95"
            >
              {t.precision.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== COUPE DU MONDE (score démo) ==================== */}
      <MatchShowcase home={f.home} away={f.away} outcome={f.outcome} score={f.score} t={t.worldCup} />

      {/* ============================ AVIS ============================ */}
      <ReviewsCarousel t={t} />

      {/* ====================== COMMENT ÇA MARCHE ====================== */}
      <section id="comment-ca-marche" className="relative mx-auto max-w-6xl px-5 py-24">
        <h2 className="display-title text-center text-[clamp(2.4rem,5.4vw,4.6rem)] text-display-green text-glow">
          {t.how.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/65">{t.how.subtitle}</p>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Step index="1" title={t.how.step1.title} desc={t.how.step1.desc}>
            <div className="space-y-2.5">
              {SELECTOR.map((m) => (
                <div key={`${m.home}-${m.away}`} className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/85">
                    <span>{m.home}</span>
                    <span className="text-white/35">vs</span>
                    <span>{m.away}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["1", "N", "2"].map((k, idx) => (
                      <div
                        key={k}
                        className={cn(
                          "rounded-lg py-1.5 text-center transition",
                          idx === m.pick ? "bg-gold text-gold-foreground" : "bg-white/[0.04] text-white/70",
                        )}
                      >
                        <div className="text-[10px] font-bold uppercase">{k}</div>
                        <div className="text-[11px] font-bold">{m.probs[idx]}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Step>

          <Step index="2" title={t.how.step2.title} desc={t.how.step2.desc}>
            <div className="flex min-h-[190px] items-center justify-center">
              <div className="relative grid h-40 w-36 place-items-center">
                <div className="absolute inset-0 [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] bg-[linear-gradient(135deg,hsl(var(--primary)/0.35),transparent_70%)]" />
                <div className="absolute inset-[2px] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] bg-[#0b0b0b]" />
                <div className="absolute h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                <Zap
                  className="relative h-12 w-12 text-primary"
                  style={{ filter: "drop-shadow(0 0 16px hsl(var(--primary)/0.7))" }}
                />
              </div>
            </div>
          </Step>

          <Step index="3" title={t.how.step3.title} desc={t.how.step3.desc}>
            <div className="flex justify-center">
              {tickets[1] ? (
                <PredictionTicket {...tickets[1]} labels={t.ticket} featured className="w-full" />
              ) : tickets[0] ? (
                <PredictionTicket {...tickets[0]} labels={t.ticket} featured className="w-full" />
              ) : null}
            </div>
          </Step>
        </div>
      </section>

      {/* ========================== FEATURES ========================== */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.features.map((s, i) => {
            const Icon = [Target, ShieldCheck, Trophy, MessageSquare][i] ?? Target;
            return (
              <div
                key={s.t}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/40 hover:bg-white/[0.05]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white">{s.t}</h3>
                <p className="mt-1.5 text-sm text-white/60">{s.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="relative mx-auto max-w-4xl px-5 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/[0.08] to-transparent p-10 text-center sm:p-14">
          <div className="blob-gold pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full blur-3xl opacity-30" />
          <h2 className="display-title text-[clamp(2rem,4.4vw,3.6rem)] text-white">{t.finalCta.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">{t.finalCta.subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/connexion?next=%2Fapp"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gold-cta px-8 text-base font-bold text-gold-foreground shadow-[0_16px_50px_-12px_hsl(var(--gold)/0.6)] transition hover:opacity-95"
            >
              {t.finalCta.primary} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/25 bg-white/[0.04] px-8 text-base font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              {t.finalCta.secondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ========================== FOOTER ========================== */}
      <footer className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-center text-xs text-white/55 sm:flex-row sm:text-left">
          <div>
            © {new Date().getFullYear()} {SITE_NAME} · {t.footer.tagline}
          </div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-white">{t.footer.pricing}</Link>
            <Link href="/mentions-legales" className="hover:text-white">{t.footer.legal}</Link>
            <Link href="/confidentialite" className="hover:text-white">{t.footer.privacy}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({
  index,
  title,
  desc,
  children,
}: {
  index: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-extrabold text-primary">
          {index}
        </span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="mb-6 text-sm text-white/60">{desc}</p>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function ReviewsCarousel({ t }: { t: Dictionary }) {
  const items = t.reviews.items.map((item, i) => ({ ...item, name: REVIEW_NAMES[i] ?? "" }));
  const loop = [...items, ...items];
  return (
    <section className="relative z-10 mx-auto max-w-6xl overflow-hidden px-5 py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t.reviews.label}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t.reviews.title}
          </h2>
        </div>
        <div className="hidden text-right text-xs text-white/50 sm:block">{t.reviews.note}</div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max gap-4 animate-marquee">
          {loop.map((item, i) => (
            <article
              key={`${item.name}-${i}`}
              className="w-[280px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:w-[340px]"
            >
              <div className="mb-3 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="h-4 w-4 fill-gold" />
                ))}
              </div>
              <p className="min-h-[72px] text-sm leading-relaxed text-white/90">“{item.quote}”</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-sm font-bold text-primary">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-white/55">{item.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
