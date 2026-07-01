"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { cn } from "@/lib/utils";

// Liens ancres vers les sections de la landing (+ Tarifs vers la page dédiée).
const NAV_LINKS = [
  { label: "Comment ça marche", href: "#comment-ca-marche" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Coupe du Monde", href: "#coupe-du-monde" },
];

// Navbar marketing — transparente au-dessus du hero, noir + flou une fois scrollée.
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Referme le menu mobile si on repasse en desktop.
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

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/connexion"
            className="hidden h-11 items-center rounded-full border border-white/25 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/10 sm:inline-flex"
          >
            Connexion
          </Link>
          <Link
            href="/connexion?next=%2Fapp"
            className="hidden h-11 items-center gap-2 rounded-full bg-gold-cta px-5 text-sm font-bold text-gold-foreground shadow-[0_10px_34px_-8px_hsl(var(--gold)/0.55)] transition hover:opacity-95 sm:inline-flex"
          >
            Analyser un match <ArrowRight className="h-4 w-4" />
          </Link>
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

      {/* Menu mobile déroulant */}
      {open && (
        <div className="animate-fade-up lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-[clamp(18px,4vw,42px)] pb-5 pt-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/connexion"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/[0.04] text-sm font-semibold text-white"
              >
                Connexion
              </Link>
              <Link
                href="/connexion?next=%2Fapp"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-cta text-sm font-bold text-gold-foreground"
              >
                Analyser un match <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
