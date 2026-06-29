import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";
import { SUPPORT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/constants/contact";
import { SITE_NAME } from "@/lib/constants/config";

export const metadata: Metadata = {
  title: `Conditions d'utilisation — ${SITE_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalShell title="Conditions d'utilisation" updated={LEGAL_LAST_UPDATED}>
      <p>
        En utilisant {SITE_NAME}, tu acceptes les présentes conditions. Le service
        fournit des analyses de matchs de football à titre informatif uniquement.
      </p>

      <LegalSection title="1. Objet du service">
        <p>
          {SITE_NAME} propose des analyses de matchs : forme des équipes,
          probabilités, scores possibles, scénarios IA, classements et données de
          compétitions lorsque les sources disponibles le permettent.
        </p>
      </LegalSection>

      <LegalSection title="2. Information uniquement">
        <p>
          Les analyses ne constituent pas un conseil financier, un conseil de pari,
          ni une garantie de résultat. Le football reste incertain ; les scores,
          probabilités et scénarios affichés sont des estimations.
        </p>
      </LegalSection>

      <LegalSection title="3. Accès 18+">
        <p>
          Les contenus liés aux probabilités et aux pronostics sont réservés aux
          personnes majeures. N'utilise pas le service pour contourner la loi de
          ton pays ou les règles d'une plateforme tierce.
        </p>
      </LegalSection>

      <LegalSection title="4. Compte, abonnements et quotas">
        <p>
          Certaines fonctionnalités sont gratuites, d'autres sont réservées aux
          plans payants. Les quotas journaliers, les prix et les fonctionnalités
          incluses sont ceux affichés au moment de l'achat. Les paiements et
          abonnements sont gérés par Whop.
        </p>
      </LegalSection>

      <LegalSection title="5. Données et disponibilité">
        <p>
          {SITE_NAME} dépend de sources externes comme API-Football, OpenAI,
          Supabase et Whop. Une indisponibilité, une limitation de plan ou une
          erreur de source peut affecter les résultats affichés.
        </p>
      </LegalSection>

      <LegalSection title="6. Utilisation acceptable">
        <p>
          Tu t'engages à ne pas détourner le service, contourner les quotas,
          automatiser des usages abusifs, revendre les analyses ou tenter
          d'accéder à des données réservées aux abonnés.
        </p>
      </LegalSection>

      <LegalSection title="7. Clubs, joueurs et compétitions">
        <p>
          Les noms de clubs, compétitions et joueurs sont cités à titre
          informatif. {SITE_NAME} n'est affilié à aucun club, ligue, fédération,
          joueur ou marque mentionnée.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          Une question ?{" "}
          <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
