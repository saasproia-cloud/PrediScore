"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Trophy,
  Globe2,
  History,
  CreditCard,
  MessageSquare,
  Sparkles,
  Crown,
  Settings,
  Activity,
  ChevronRight,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants/config";
import { getPrediscorePlan } from "@/lib/billing/prediscore";
import type { BillingPlanId } from "@/types";

interface SidebarAccount {
  planId: BillingPlanId | null;
  active: boolean;
  analysisCount: number;
  analysisLimit: number | null;
}

const NAV = [
  { href: "/app", label: "Matchs", icon: BarChart3 },
  { href: "/app/competitions", label: "Compétitions", icon: Trophy },
  { href: "/app/world-cup", label: "Coupe du monde", icon: Globe2 },
  { href: "/app/coach", label: "Coach IA", icon: MessageSquare, badge: "Pro" },
  { href: "/app/history", label: "Historique", icon: History },
  { href: "/app/subscription", label: "Abonnement", icon: CreditCard },
  { href: "/app/settings", label: "Paramètres", icon: Settings },
];

function Brand() {
  return (
    <Link href="/app" className="group app-panel flex items-center gap-3 rounded-lg px-3 py-3 transition">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-black/[0.28] ring-1 ring-white/[0.12]">
        <Image
          src="/prediscore-mark.png"
          alt=""
          width={48}
          height={48}
          className="h-10 w-10 object-contain drop-shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold tracking-tight text-foreground">{SITE_NAME}</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
          Intelligence match
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}

function UpgradeCard({ account }: { account: SidebarAccount }) {
  const plan = account.planId ? getPrediscorePlan(account.planId) : null;
  if (account.active && plan) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-gold/25 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary)/0.18),transparent_40%),radial-gradient(circle_at_92%_0%,hsl(var(--gold)/0.12),transparent_36%),linear-gradient(145deg,hsl(var(--card)/0.86),hsl(164_42%_8%/0.92))] p-3.5 shadow-[0_16px_45px_rgb(0_0_0/0.18)]">
        <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Crown className="h-4 w-4 shrink-0 text-gold" /> Plan {plan.name}
          </span>
          <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] text-gold-soft">
            Actif
          </span>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {account.planId === "essentiel"
            ? "1 analyse complète par jour. Passe Pro pour l'illimité et le Coach IA."
            : account.planId === "pro"
              ? "Analyses illimitées et 1 question Coach IA par jour."
              : "Accès à vie actif : analyses et Coach IA illimités."}
        </p>
        {account.planId === "essentiel" && (
          <Link
            href="/app/subscription"
            className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient text-xs font-extrabold text-primary-foreground transition hover:opacity-95"
          >
            <Sparkles className="h-3.5 w-3.5" /> Passer Pro
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-gold/25 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.20),transparent_44%),radial-gradient(circle_at_100%_0%,hsl(var(--gold)/0.13),transparent_42%),linear-gradient(145deg,hsl(var(--card)/0.88),hsl(164_44%_8%/0.94))] p-3.5 shadow-[0_16px_45px_rgb(0_0_0/0.18)]">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-foreground">
        <Crown className="h-4 w-4 text-gold" /> Débloquer PrediScore
      </div>
      <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
        Verdict complet, marchés avancés et Coach IA selon ton plan.
      </p>
      <Link
        href="/app/subscription"
        className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient text-xs font-extrabold text-primary-foreground transition hover:opacity-95"
      >
        <Sparkles className="h-3.5 w-3.5" /> Voir les abonnements
      </Link>
    </div>
  );
}

function QuotaBox({ account }: { account: SidebarAccount }) {
  const unlimited = account.analysisLimit === null;
  const limit = account.analysisLimit ?? 0;
  const pct = unlimited || limit <= 0 ? 100 : Math.min(100, (account.analysisCount / limit) * 100);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> Analyses du jour
        </span>
        <span className="font-semibold">
          {unlimited ? "∞" : `${account.analysisCount} / ${limit}`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", unlimited || pct < 100 ? "bg-brand-gradient" : "bg-rose-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={cn("mt-1.5 text-center text-[11px]", pct >= 100 && !unlimited ? "text-rose-400" : "text-muted-foreground")}>
        {unlimited ? "Analyses illimitées" : limit > 0 ? (pct >= 100 ? "Limite atteinte" : "Quota disponible") : "Aperçu gratuit"}
      </div>
    </div>
  );
}

export function Sidebar({ account }: { account: SidebarAccount }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 z-20 hidden h-dvh w-[292px] shrink-0 flex-col gap-5 border-r border-white/10 bg-[linear-gradient(180deg,hsl(166_38%_7%/0.92),hsl(158_46%_6%/0.88))] p-4 shadow-[24px_0_70px_rgb(0_0_0/0.18)] backdrop-blur-2xl lg:flex">
      <div className="pt-1">
        <Brand />
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Accès</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {account.active ? "Premium" : "Gratuit"}
        </div>
      </div>
      <nav className="flex flex-col gap-1.5">
        <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-[linear-gradient(90deg,hsl(var(--primary)/0.17),hsl(var(--gold)/0.055))] text-foreground ring-1 ring-primary/25"
                  : "text-muted-foreground hover:bg-white/[0.045] hover:text-foreground",
              )}
            >
              {active && <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-primary" />}
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition", active ? "bg-primary/[0.18] text-primary" : "bg-white/[0.035] text-muted-foreground group-hover:text-foreground")}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-gold/[0.15] px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <UpgradeCard account={account} />
        <QuotaBox account={account} />
        <Link href="/connexion" className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground">
          <span className="inline-flex items-center gap-2">
            <LogIn className="h-3.5 w-3.5" /> Connexion / Compte
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);
  const items = NAV.filter((item) =>
    ["/app", "/app/competitions", "/app/coach", "/app/subscription", "/app/settings"].includes(item.href),
  );
  const mobileLabels: Record<string, string> = {
    "/app": "Matchs",
    "/app/competitions": "Ligues",
    "/app/coach": "Coach",
    "/app/subscription": "Plan",
    "/app/settings": "Réglages",
  };
  return (
    <nav className="fixed inset-x-3 bottom-[calc(0.7rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-2xl border border-white/[0.12] bg-[hsl(var(--background)/0.88)] p-1.5 shadow-[0_20px_70px_rgb(0_0_0/0.38)] backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-semibold transition",
              active ? "bg-primary/[0.14] text-primary ring-1 ring-primary/20" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{mobileLabels[item.href] ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
