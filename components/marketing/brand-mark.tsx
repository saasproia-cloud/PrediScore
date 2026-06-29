import Link from "next/link";
import Image from "next/image";
import { SITE_NAME } from "@/lib/constants/config";

const MARK_SRC = "/prediscore-mark.png";

// Logo prediscore officiel.
export function BrandMark({
  href = "/",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-10 w-10 items-center justify-center">
        <Image
          src={MARK_SRC}
          alt=""
          width={48}
          height={48}
          priority
          className="h-10 w-10 object-contain drop-shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
        />
      </span>
      <span className="sr-only">{SITE_NAME}</span>
    </Link>
  );
}
