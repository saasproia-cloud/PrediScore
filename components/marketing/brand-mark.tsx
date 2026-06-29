import Link from "next/link";
import Image from "next/image";
import { SITE_NAME } from "@/lib/constants/config";

const BRAND_ASSETS = {
  lockup: {
    src: "/brand/prediscore-lockup-transparent-trimmed.png",
    width: 446,
    height: 122,
    className: "h-10 w-auto sm:h-12",
  },
  mark: {
    src: "/brand/prediscore-mark-transparent-trimmed.png",
    width: 184,
    height: 179,
    className: "h-11 w-11",
  },
  wordmark: {
    src: "/brand/prediscore-wordmark-transparent-trimmed.png",
    width: 311,
    height: 43,
    className: "h-7 w-auto sm:h-8",
  },
} as const;

type BrandVariant = keyof typeof BRAND_ASSETS;

// Logo PrediScore officiel.
export function BrandMark({
  href = "/",
  className = "",
  variant = "lockup",
}: {
  href?: string;
  className?: string;
  variant?: BrandVariant;
}) {
  const asset = BRAND_ASSETS[variant];
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label={SITE_NAME}>
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        priority
        className={`${asset.className} object-contain drop-shadow-[0_0_16px_hsl(var(--gold)/0.18)]`}
      />
      <span className="sr-only">{SITE_NAME}</span>
    </Link>
  );
}
