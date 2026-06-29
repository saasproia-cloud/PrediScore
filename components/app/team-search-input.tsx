"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import type { TeamRef } from "@/types/football";
import { cn } from "@/lib/utils";

interface Props {
  placeholder?: string;
  value: TeamRef | null;
  onChange: (team: TeamRef | null) => void;
}

export function TeamSearchInput({ placeholder, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamRef[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) return; // équipe choisie → pas de recherche.
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data.teams ?? []);
        setOpen(true);
      } catch {
        /* annulé */
      } finally {
        setLoading(false);
      }
    }, 110);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [query, value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (value) {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-primary/40 bg-background/[0.65] px-3.5 py-3 shadow-[0_0_0_1px_hsl(var(--primary)/0.06),0_12px_35px_rgb(0_0_0/0.16)]">
        {value.logo ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
            <Image
              src={value.logo}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 object-contain"
            />
          </span>
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{value.name}</span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Retirer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border border-input bg-background/75 pl-10 pr-4 text-base text-foreground outline-none ring-primary/50 transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 sm:text-sm"
        />
      </div>
      {open && (results.length > 0 || loading || query.trim().length >= 2) && (
        <div className="absolute z-50 mt-2 max-h-[min(20rem,48dvh)] w-full overflow-y-auto rounded-lg border border-primary/25 bg-card shadow-[0_22px_70px_rgb(0_0_0/0.46),0_0_0_1px_hsl(var(--primary)/0.10)]">
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Recherche…</div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucune équipe trouvée.
            </div>
          )}
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm transition hover:bg-primary/10 sm:px-4 sm:py-2.5",
              )}
            >
              {t.logo ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
                  <Image
                    src={t.logo}
                    alt=""
                    width={26}
                    height={26}
                    unoptimized
                    className="h-[26px] w-[26px] object-contain"
                  />
                </span>
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-lg bg-muted" />
              )}
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              {t.country && <span className="max-w-20 truncate text-xs text-muted-foreground sm:max-w-28">{t.country}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
