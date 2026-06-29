import Image from "next/image";

// Fond hero local avec overlays PrediScore. L'image garde les joueurs visibles
// pendant que le centre reste lisible pour le titre et la recherche.

export function StadiumBg({ className = "" }: { className?: string }) {
  const line = "rgba(210,255,235,0.30)";
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <Image
        src="/hero-bg-current.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-[1.015] object-cover object-center opacity-100 contrast-[1.08] saturate-[1.18]"
      />

      {/* voile de lisibilité */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(166_48%_5%/0.56)_0%,hsl(210_28%_5%/0.28)_34%,hsl(210_28%_5%/0.32)_66%,hsl(166_48%_5%/0.58)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(218_45%_5%/0.42)_0%,hsl(210_30%_5%/0.12)_42%,hsl(166_42%_5%/0.62)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(58%_40%_at_50%_32%,transparent_0%,hsl(218_48%_4%/0.28)_86%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(52%_32%_at_50%_42%,hsl(var(--gold)/0.085),transparent_68%)]" />

      {/* halos de couleur — réchauffent la scène */}
      <div className="blob-emerald absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-22" />
      <div className="blob-gold absolute left-[44%] top-[12%] h-[260px] w-[260px] rounded-full blur-3xl opacity-18" />
      <div className="blob-teal absolute -right-24 top-10 h-[360px] w-[360px] rounded-full blur-3xl opacity-18" />

      {/* projecteurs */}
      <div className="floodlight absolute inset-x-0 top-0 h-[72%]" />

      {/* marquages subtils en surcouche pour renforcer l'effet terrain */}
      <div className="absolute inset-x-0 bottom-0 h-[52%] opacity-0" style={{ perspective: "900px" }}>
        <svg
          viewBox="0 0 680 440"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          style={{ transform: "rotateX(66deg) scale(1.45)", transformOrigin: "bottom center" }}
        >
          <g stroke={line} strokeWidth="2" fill="none">
            <rect x="14" y="14" width="652" height="412" rx="2" />
            <line x1="340" y1="14" x2="340" y2="426" />
            <circle cx="340" cy="220" r="62" />
            {/* surface gauche */}
            <rect x="14" y="120" width="92" height="200" />
            <rect x="14" y="170" width="34" height="100" />
            {/* surface droite */}
            <rect x="574" y="120" width="92" height="200" />
            <rect x="632" y="170" width="34" height="100" />
          </g>
          <g fill={line}>
            <circle cx="340" cy="220" r="3" />
            <circle cx="78" cy="220" r="3" />
            <circle cx="602" cy="220" r="3" />
          </g>
        </svg>
      </div>

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_88%_at_50%_30%,transparent_42%,hsl(218_48%_4%/0.56))]" />
    </div>
  );
}
