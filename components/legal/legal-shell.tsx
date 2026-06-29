import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { SUPPORT_EMAIL } from "@/lib/constants/contact";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <BrandMark />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {updated && (
          <p className="mt-2 text-sm text-muted-foreground">
            Dernière mise à jour : {updated}
          </p>
        )}
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} PrediScore. Tous droits réservés.</span>
          <a className="hover:text-foreground" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}
