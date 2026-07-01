// Carrousel auto-défilant des ligues couvertes. Boucle sans couture (contenu
// dupliqué + translateX -50%).

import Image from "next/image";
import { LEAGUES } from "@/lib/football/leagues";

export function LeagueMarquee() {
  const items = LEAGUES.filter((l) => l.id !== 1); // hors Coupe du monde
  const row = [...items, ...items]; // duplication pour la boucle

  return (
    <div className="relative w-full overflow-hidden py-2">
      {/* masques latéraux */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <div className="flex w-max animate-marquee items-center gap-3">
        {row.map((l, i) => (
          <div
            key={`${l.id}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur"
          >
            {l.logo && (
              <Image src={l.logo} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            )}
            <span className="whitespace-nowrap text-sm font-medium text-white/70">{l.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
