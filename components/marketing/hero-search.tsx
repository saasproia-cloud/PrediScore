"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import type { TeamRef } from "@/types/football";
import { cn } from "@/lib/utils";

export function HeroSearch({
  placeholder = "Recherchez une équipe (ex : Maroc, France, PSG…)",
  analyzeLabel = "Analyser le match",
  analyzeShortLabel = "Analyser",
}: {
  placeholder?: string;
  analyzeLabel?: string;
  analyzeShortLabel?: string;
} = {}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TeamRef | null>(null);
  const [results, setResults] = useState<TeamRef[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) return;
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teams/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data.teams ?? []);
        setOpen(true);
      } catch {
        // Recherche annulée ou réseau indisponible.
      } finally {
        setLoading(false);
      }
    }, 110);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, selected]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = () => {
    const value = selected?.name ?? q.trim();
    const next = value
      ? `/app?team=${encodeURIComponent(value)}${selected?.id ? `&teamId=${selected.id}` : ""}`
      : "/app";
    router.push(`/connexion?next=${encodeURIComponent(next)}`);
  };
  const leadingTeam = selected ?? (!loading && q.trim().length >= 2 ? results[0] : null);

  return (
    <div ref={boxRef} className="mx-auto w-full max-w-[560px]">
      <div className="relative">
        {!leadingTeam?.logo && (
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" />
        )}
        {leadingTeam?.logo && (
          <Image
            src={leadingTeam.logo}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-7 w-7 -translate-y-1/2 object-contain drop-shadow-[0_0_10px_hsl(var(--primary)/0.25)]"
          />
        )}
        <input
          value={selected ? selected.name : q}
          onChange={(e) => {
            setSelected(null);
            setQ(e.target.value);
          }}
          onFocus={() => (results.length || q.trim().length >= 2) && setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder={placeholder}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            color: "#ffffff",
            WebkitTextFillColor: "#ffffff",
            colorScheme: "dark",
          }}
          className={cn(
            "h-16 w-full appearance-none rounded-2xl border border-gold/50 pr-[124px] text-base font-medium shadow-[0_0_0_1px_hsl(var(--gold)/0.18),0_28px_80px_-24px_hsl(var(--gold)/0.4)] outline-none ring-gold/40 backdrop-blur-md transition placeholder:text-white/45 focus:border-gold focus:ring-2 sm:pr-[188px]",
            leadingTeam?.logo ? "pl-14" : "pl-12",
          )}
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setQ("");
              setResults([]);
            }}
            className="absolute right-[118px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white sm:right-[196px]"
            aria-label="Effacer l'équipe"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={go}
          className="absolute right-2 top-1/2 flex h-12 -translate-y-1/2 items-center gap-2 rounded-xl bg-gold-cta px-4 text-sm font-bold text-gold-foreground shadow-[0_8px_24px_-6px_hsl(var(--gold)/0.5)] transition hover:opacity-95"
        >
          <span className="hidden sm:inline">{analyzeLabel}</span>
          <span className="sm:hidden">{analyzeShortLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {open && (loading || results.length > 0 || q.trim().length >= 2) && !selected && (
          <div
            className="absolute z-30 mt-2 max-h-[420px] w-full overflow-y-auto rounded-2xl border border-gold/30 text-left shadow-[0_28px_80px_-16px_rgb(0_0_0/0.8)] backdrop-blur-xl"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
          >
            {loading && results.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Recherche...
              </div>
            )}
            {!loading && results.length === 0 && q.trim().length >= 2 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Aucune équipe trouvée.
              </div>
            )}
            {results.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  setSelected(team);
                  setQ(team.name);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-primary/[0.12]"
              >
                {team.logo ? (
                  <Image src={team.logo} alt="" width={26} height={26} unoptimized className="h-[26px] w-[26px] object-contain" />
                ) : (
                  <div className="h-[26px] w-[26px] rounded-full bg-muted" />
                )}
                <span className="min-w-0 flex-1 truncate font-semibold text-white">{team.name}</span>
                {team.country && <span className="max-w-24 truncate text-xs text-white/48">{team.country}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
