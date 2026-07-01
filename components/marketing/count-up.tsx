"use client";

import { useEffect, useRef, useState } from "react";

// Compteur animé : démarre quand le nombre entre dans le viewport (léger, rAF).
export function CountUp({
  end,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(end);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
              setValue(end * eased);
              if (p < 1) requestAnimationFrame(tick);
              else setValue(end);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
