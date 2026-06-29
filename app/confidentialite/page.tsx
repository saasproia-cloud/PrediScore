import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";
import { SUPPORT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/constants/contact";
import { SITE_NAME } from "@/lib/constants/config";

export const metadata: Metadata = {
  title: `Politique de confidentialité — ${SITE_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Politique de confidentialité" updated={LEGAL_LAST_UPDATED}>
      <p>
        Cette politique explique quelles données {SITE_NAME} collecte, pourquoi,
        et comment elles sont utilisées.
      </p>

      <LegalSection title="1. Responsable du traitement">
        <p>
          {SITE_NAME}. Pour toute question relative à tes données, contacte-nous
          à{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>
          Nous pouvons traiter ton e-mail de compte, ton statut d'abonnement, tes
          quotas journaliers, tes recherches d'équipes et les messages envoyés au
          Coach IA. Les paiements sont traités par Whop.
        </p>
      </LegalSection>

      <LegalSection title="3. Finalités">
        <p>
          Ces données servent à fournir l'analyse de match, gérer l'accès premium,
          limiter les abus, mémoriser les quotas et améliorer la qualité du
          service.
        </p>
      </LegalSection>

      <LegalSection title="4. Prestataires">
        <ul className="ml-4 list-disc space-y-1">
          <li><strong className="text-foreground">Supabase</strong> — authentification, abonnements et quotas.</li>
          <li><strong className="text-foreground">Whop</strong> — checkout, paiements et webhooks d'abonnement.</li>
          <li><strong className="text-foreground">API-Football</strong> — données d'équipes, compétitions, matchs et statistiques.</li>
          <li><strong className="text-foreground">OpenAI</strong> — génération des scénarios et réponses du Coach IA.</li>
          <li><strong className="text-foreground">Vercel</strong> — hébergement du site.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Conservation">
        <p>
          Les données de compte et d'abonnement sont conservées tant que ton
          compte ou ton accès premium est actif. Les quotas journaliers sont
          conservés pour contrôler l'usage et diagnostiquer les abus.
        </p>
      </LegalSection>

      <LegalSection title="6. Tes droits">
        <p>
          Tu peux demander l'accès, la rectification ou la suppression de tes
          données en écrivant à{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies & stockage local">
        <p>
          Le service utilise des cookies techniques pour l'authentification et du
          stockage local lorsque c'est nécessaire au fonctionnement de l'app.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
