# Gérer les abonnements (admin)

Tu gères tous les abonnements **directement dans Supabase**, sans toucher au code.

## Comment ça marche

- L'abonnement vit dans la table `public.payments`, **repérée par email**, via une
  colonne **`tier`** : `gratuit` · `essentiel` · `pro` · `lifetime`.
- `tier = gratuit` → non premium. Les 3 autres → premium.
- Le match se fait sur **l'email avec lequel la personne se connecte** (insensible
  à la casse). Tu peux donc accorder un abo à un email **même avant** que la
  personne n'ait créé son compte : dès qu'elle se connecte avec cet email, elle
  est premium.
- Un **trigger** garde `tier` et l'accès (`status`/`plan_id`) synchronisés dans les
  deux sens : que tu changes le menu OU qu'un vrai paiement Whop arrive.
- Tout changement prend effet **au prochain chargement** de page du membre.

## Installation (une seule fois)

Dans Supabase → **SQL Editor**, exécute le contenu de
[`supabase/admin-subscriptions.sql`](../supabase/admin-subscriptions.sql).
Ça ajoute la colonne `tier` + le trigger, une vue `admin.members` et deux
fonctions. (Pré-requis : [`supabase/schema.sql`](../supabase/schema.sql) déjà
exécuté.) Le fichier est sûr à ré-exécuter.

## La méthode simple : le menu déroulant (Table Editor)

1. Supabase → **Table Editor** → schéma `public` → table **`payments`**.
2. Pour un membre existant : clique la cellule **`tier`** de sa ligne et choisis
   dans le menu (`gratuit` / `essentiel` / `pro` / `lifetime`).
3. Pour offrir un abo à quelqu'un qui n'a pas encore de ligne : **Insert row**,
   mets son **`email`** (en minuscules) et choisis le **`tier`**. Laisse le reste
   par défaut — le trigger remplit `status`/`plan_id` tout seul.

C'est tout. Pas besoin de toucher à `status` ni `plan_id` : ils suivent `tier`.

## Voir tout le monde

Dans le **SQL Editor** :

```sql
select email, tier, is_premium, kind, account_created from admin.members;
```

`kind` = `compte sans abo` / `compte + abo` / `paiement sans compte`.

## Alternative : tout en SQL (sans le Table Editor)

```sql
select admin.set_subscription('jean@exemple.com');             -- 'pro' par défaut
select admin.set_subscription('jean@exemple.com', 'lifetime'); -- à vie
select admin.set_subscription('jean@exemple.com', 'essentiel');
select admin.revoke_subscription('jean@exemple.com');          -- repasse gratuit
```

## Sécurité

Le schéma `admin` n'est **pas exposé** par l'API du site, et les droits sont
retirés aux rôles `anon` / `authenticated`. Aucun utilisateur ne peut lister les
membres ni s'accorder un abonnement : seul le SQL Editor (toi) y a accès.
