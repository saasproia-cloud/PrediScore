# SEO PrediScore

Objectif : indexer PrediScore comme outil d'analyse de matchs de football par IA.

## À vérifier avant lancement

- `SITE_URL` dans `lib/constants/config.ts` pointe vers `https://prediscore.fr`.
- `/`, `/pricing`, `/mentions-legales`, `/confidentialite`, `/conditions` répondent en 200.
- `/sitemap.xml`, `/robots.txt` et `/opengraph-image` répondent en 200.
- Les titres OpenGraph affichent PrediScore et la promesse d'analyse de match.
- Les pages publiques contiennent l'adresse support `prediscore.app@gmail.com`.

## Après déploiement

- Ajouter le domaine dans Google Search Console.
- Soumettre `https://prediscore.fr/sitemap.xml`.
- Créer les profils sociaux officiels PrediScore et mettre à jour `sameAs` dans `app/layout.tsx`.
- Vérifier `site:prediscore.fr` une fois l'indexation lancée.
