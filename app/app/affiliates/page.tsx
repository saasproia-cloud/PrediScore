import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Handshake, LinkIcon, Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/affiliate/config";
import { createAffiliate, listAffiliateStats } from "@/lib/data/affiliate";
import { SITE_URL } from "@/lib/constants/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliés" };

async function getAdminEmail(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email && isAdminEmail(user.email) ? user.email : null;
  } catch {
    return null;
  }
}

// Server action — re-vérifie l'admin (les actions sont des endpoints publics).
async function createAffiliateAction(formData: FormData) {
  "use server";
  if (!(await getAdminEmail())) return;
  const rateRaw = Number(formData.get("rate"));
  await createAffiliate({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    payoutEmail: String(formData.get("payoutEmail") ?? ""),
    rate: Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw / 100 : undefined,
  });
  revalidatePath("/app/affiliates");
}

export default async function AffiliatesPage() {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) notFound();

  const stats = await listAffiliateStats();
  const eur = (v: number | null) => `${Number(v ?? 0).toFixed(2)} €`;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="app-panel rounded-lg p-4 sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <Handshake className="h-3.5 w-3.5" /> Admin
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Affiliés</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Crée un lien par influenceur, partage-le, et suis clics, inscriptions, clients payants et
          commissions dues. Commission = % du 1er paiement.
        </p>
      </header>

      {/* Créer un affilié */}
      <section className="app-panel-muted rounded-lg p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary" /> Nouveau lien d&apos;affiliation
        </h2>
        <form action={createAffiliateAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            name="code"
            required
            placeholder="Code (ex : yassine)"
            className="rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
          />
          <input
            name="name"
            placeholder="Nom de l'influenceur"
            className="rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
          />
          <input
            name="payoutEmail"
            type="email"
            placeholder="Email de paiement (Whop)"
            className="rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
          />
          <input
            name="rate"
            type="number"
            min={1}
            max={100}
            defaultValue={30}
            placeholder="% commission"
            className="rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary"
          />
          <button
            type="submit"
            className="flex h-full min-h-10 items-center justify-center gap-2 rounded-lg bg-gold-cta px-4 text-sm font-bold text-gold-foreground transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Créer le lien
          </button>
        </form>
      </section>

      {/* Tableau des affiliés */}
      <section className="app-panel-muted overflow-x-auto rounded-lg p-4 sm:p-5">
        {stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun affilié pour l&apos;instant. Crée ton premier lien ci-dessus.
          </p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-3 font-semibold">Influenceur</th>
                <th className="pb-3 pr-3 font-semibold">Lien</th>
                <th className="pb-3 pr-3 text-right font-semibold">Clics</th>
                <th className="pb-3 pr-3 text-right font-semibold">Inscrits</th>
                <th className="pb-3 pr-3 text-right font-semibold">Payants</th>
                <th className="pb-3 pr-3 text-right font-semibold">CA</th>
                <th className="pb-3 text-right font-semibold">Commission</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((a) => {
                const link = `${SITE_URL}/?ref=${a.code}`;
                return (
                  <tr key={a.code} className="border-t border-white/8">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-foreground">{a.name || a.code}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {a.payout_email || "—"} · {Math.round(Number(a.commission_rate) * 100)}%
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-1.5">
                        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <input
                          readOnly
                          value={link}
                          className="w-[240px] max-w-[46vw] rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white/80"
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">{a.clicks}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{a.signups}</td>
                    <td className="py-3 pr-3 text-right font-semibold tabular-nums text-primary">
                      {a.paying}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">{eur(a.revenue)}</td>
                    <td className="py-3 text-right font-bold tabular-nums text-gold">
                      {eur(a.commission_total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
