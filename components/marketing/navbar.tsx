"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { LanguageSelector } from "@/components/marketing/language-selector";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Navbar marketing — logo à gauche, onglet Affiliation + langue + CTA à droite.
// Transparente au-dessus du hero, noir + flou une fois scrollée.
export function Navbar({
  locale,
  nav,
  langLabel,
}: {
  locale: Locale;
  nav: { affiliation: string; login: string; cta: string };
  langLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-black/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-[clamp(18px,4vw,42px)] sm:h-[72px]">
        <BrandMark className="shrink-0" />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Onglet Affiliation (desktop) */}
          <Link
            href="/affiliation"
            className="group hidden h-11 items-center gap-2 rounded-full border border-gold/35 bg-[radial-gradient(circle_at_30%_0%,hsl(var(--gold)/0.18),transparent),hsl(0_0%_100%/0.02)] px-4 text-sm font-bold text-gold-soft shadow-[0_0_24px_-8px_hsl(var(--gold)/0.5)] transition hover:border-gold/60 hover:text-gold lg:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            {nav.affiliation}
          </Link>

          <div className="hidden lg:block">
            <LanguageSelector locale={locale} label={langLabel} />
          </div>

          <Link
            href="/connexion"
            className="hidden h-11 items-center rounded-full border border-white/25 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10 sm:inline-flex"
          >
            {nav.login}
          </Link>
          <Link
            href="/connexion?next=%2Fapp"
            className="hidden h-11 items-center gap-2 rounded-full bg-gold-cta px-5 text-sm font-bold text-gold-foreground shadow-[0_10px_34px_-8px_hsl(var(--gold)/0.55)] transition hover:opacity-95 sm:inline-flex"
          >
            {nav.cta} <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Mobile : langue + burger */}
          <div className="lg:hidden">
            <LanguageSelector locale={locale} label={langLabel} />
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="animate-fade-up lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-[clamp(18px,4vw,42px)] pb-5 pt-1">
            <Link
              href="/affiliation"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/[0.08] px-4 py-3 text-base font-bold text-gold-soft"
            >
              <Sparkles className="h-4 w-4" />
              {nav.affiliation}
            </Link>
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/[0.04] text-sm font-semibold text-white"
            >
              {nav.login}
            </Link>
            <Link
              href="/connexion?next=%2Fapp"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-cta text-sm font-bold text-gold-foreground"
            >
              {nav.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
