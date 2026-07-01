import { notFound } from "next/navigation";
import { MousePointerClick, UserPlus, CreditCard, Wallet } from "lucide-react";
import { getAffiliateStatByToken } from "@/lib/data/affiliate";
import { BrandMark } from "@/components/marketing/brand-mark";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace partenaire", robots: { index: false } };

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const stat = await getAffiliateStatByToken(token);
  if (!stat) notFound();

  const eur = (v: number | null) => `${Number(v ?? 0).toFixed(2)} €`;
  const ratePct = Math.round(Number(stat.commission_rate) * 100);

  const cards = [
    { icon: MousePointerClick, label: "Clics sur ton lien", value: String(stat.clicks), tone: "muted" as const },
    { icon: UserPlus, label: "Inscriptions", value: String(stat.signups), tone: "muted" as const },
    { icon: CreditCard, label: "Clients payants", value: String(stat.paying), tone: "green" as const },
    { icon: Wallet, label: "Tes gains", value: eur(stat.commission_total), tone: "gold" as const },
  ];

  return (
    <main className="min-h-dvh bg-background px-5 py-10 text-foreground sm:py-16">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <BrandMark variant="lockup" />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              Espace partenaire
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {stat.name || stat.code}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tes statistiques d&apos;affiliation en temps réel · commission {ratePct}% du 1<sup>er</sup> paiement
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          {cards.map(({ icon: Icon, label, value, tone }) => (
            <div
              key={label}
              className={
                "rounded-2xl border p-4 sm:p-5 " +
                (tone === "gold"
                  ? "border-gold/30 bg-gold/[0.06]"
                  : tone === "green"
                    ? "border-primary/30 bg-primary/[0.06]"
                    : "border-white/10 bg-white/[0.03]")
              }
            >
              <Icon
                className={
                  "mb-3 h-5 w-5 " +
                  (tone === "gold" ? "text-gold" : tone === "green" ? "text-primary" : "text-muted-foreground")
                }
              />
              <div
                className={
                  "text-2xl font-extrabold tabular-nums sm:text-3xl " +
                  (tone === "gold" ? "text-gold" : tone === "green" ? "text-primary" : "text-foreground")
                }
              >
                {value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-muted-foreground sm:p-6">
          <h2 className="mb-2 font-semibold text-foreground">Comment ça marche</h2>
          <p>
            Chaque personne qui passe par ton lien et prend un abonnement te rapporte{" "}
            <span className="font-semibold text-gold">{ratePct}%</span> de son premier paiement.
            Le total « Tes gains » est ce qui te sera versé. Les paiements sont réglés chaque fin de mois.
          </p>
          <p className="mt-3 text-xs text-white/40">
            Lien privé — ne le partage pas. Il donne accès uniquement à ces statistiques, à rien d&apos;autre.
          </p>
        </section>
      </div>
    </main>
  );
}
