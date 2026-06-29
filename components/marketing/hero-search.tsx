"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import type { TeamRef } from "@/types/football";
import { cn } from "@/lib/utils";

export function HeroSearch() {
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
    <div ref={boxRef} className="mx-auto w-full max-w-[440px]">
      <div className="relative">
        {!leadingTeam?.logo && (
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
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
          placeholder="Recherchez l'une des équipes (ex : Maroc, France, PSG...)"
          style={{
            backgroundColor: "rgba(5, 10, 20, 0.96)",
            color: "#ffffff",
            WebkitTextFillColor: "#ffffff",
            colorScheme: "dark",
          }}
          className={cn(
            "h-[52px] w-full appearance-none rounded-xl border border-gold/[0.55] pr-28 text-base font-medium shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_18px_55px_hsl(var(--primary)/0.2)] outline-none ring-primary/[0.35] backdrop-blur-md transition placeholder:text-white/[0.48] focus:border-primary focus:ring-2 sm:text-sm",
            leadingTeam?.logo ? "pl-14" : "pl-11",
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
            className="absolute right-24 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="Effacer l'équipe"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={go}
          className="absolute right-2 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-lg border border-gold/30 bg-[#081811] px-3 text-xs font-extrabold text-white transition hover:border-gold/60 hover:bg-primary hover:text-primary-foreground"
        >
          Continuer <ArrowRight className="h-4 w-4" />
        </button>

        {open && (loading || results.length > 0 || q.trim().length >= 2) && !selected && (
          <div
            className="absolute z-30 mt-2 max-h-[420px] w-full overflow-y-auto rounded-xl border border-gold/30 text-left shadow-[0_20px_65px_hsl(var(--primary)/0.18)] backdrop-blur-xl"
            style={{ backgroundColor: "rgba(5, 10, 20, 0.97)" }}
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
