import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { getI18n } from "@/lib/i18n/get-dictionary";

export const metadata = { title: "Affiliation" };

export default async function AffiliationPage() {
  const { locale, t } = await getI18n();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <Navbar locale={locale} nav={t.nav} langLabel={t.langMenu} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_-10%,hsl(0_0%_10%),hsl(0_0%_3.5%)_70%)]" />
        <div className="blob-gold absolute left-1/2 top-[6%] h-[360px] w-[520px] -translate-x-1/2 rounded-full blur-3xl opacity-25" />
        <div className="blob-emerald absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full blur-3xl opacity-20" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 py-32 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
          <Sparkles className="h-3.5 w-3.5" /> {t.affiliation.badge}
        </span>
        <h1 className="display-title text-[clamp(2.4rem,6vw,4.6rem)] text-white">
          {t.affiliation.title}
        </h1>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
          <Clock className="h-4 w-4" /> {t.affiliation.soon}
        </div>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/70">
          {t.affiliation.desc}
        </p>
        <Link
          href="/"
          className="mt-9 inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> {t.affiliation.back}
        </Link>
      </main>
    </div>
  );
}
