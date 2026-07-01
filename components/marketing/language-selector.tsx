"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, LOCALE_META, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Sélecteur de langue — pose un cookie puis rafraîchit (re-render serveur traduit).
export function LanguageSelector({
  locale,
  label = "Langue",
  align = "right",
}: {
  locale: Locale;
  label?: string;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    setOpen(false);
    if (l !== locale) router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className="flex h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
      >
        <Globe className="h-4 w-4" />
        <span>{LOCALE_META[locale].short}</span>
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/12 bg-black/95 p-1 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.8)] backdrop-blur-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => choose(l)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-white/[0.06]",
                l === locale ? "text-white" : "text-white/70",
              )}
            >
              <span className="text-base leading-none">{LOCALE_META[l].flag}</span>
              <span className="flex-1 text-left font-medium">{LOCALE_META[l].label}</span>
              {l === locale && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
