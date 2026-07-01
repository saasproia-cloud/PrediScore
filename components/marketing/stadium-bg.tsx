import Image from "next/image";

// Fond hero — vraie photo (célébration des Bleus) assombrie façon Kickly,
// avec overlays noir + touches or/vert pour la lisibilité du titre.
export function StadiumBg({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-background ${className}`}
      aria-hidden
    >
      <Image
        src="/hero-bg-current.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Assombrissement global — ambiance noire premium */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dégradé vertical : haut sombre (navbar) → milieu visible → fondu bas */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(0_0%_0%/0.78)_0%,hsl(0_0%_0%/0.28)_30%,hsl(0_0%_0%/0.44)_66%,hsl(var(--background))_100%)]" />

      {/* Halo sombre derrière le titre pour renforcer le contraste */}
      <div className="absolute inset-0 bg-[radial-gradient(58%_46%_at_50%_40%,hsl(0_0%_0%/0.5),transparent_74%)]" />

      {/* Projecteurs + touches de couleur marque (or / vert) très subtiles */}
      <div className="floodlight absolute inset-x-0 top-0 h-[58%]" />
      <div className="blob-gold absolute left-[46%] top-[2%] h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-3xl opacity-20" />
      <div className="blob-emerald absolute -left-24 top-1/3 h-[360px] w-[360px] rounded-full blur-3xl opacity-[0.14]" />
      <div className="blob-teal absolute -right-24 top-16 h-[340px] w-[340px] rounded-full blur-3xl opacity-[0.14]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_44%,hsl(0_0%_0%/0.62))]" />
    </div>
  );
}
