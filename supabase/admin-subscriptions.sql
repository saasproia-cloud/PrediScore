-- =============================================================================
-- PrediScore — Admin abonnements (à exécuter dans Supabase → SQL Editor, une fois)
-- -----------------------------------------------------------------------------
-- Pré-requis : schema.sql déjà exécuté (table `payments`).
-- Sûr à ré-exécuter (idempotent).
--
-- Ce que ça ajoute, pour que TU puisses gérer les abonnements de tout le monde
-- depuis le dashboard Supabase, sans toucher au code :
--
--   1. Une colonne déroulante `tier` sur `payments` (gratuit | essentiel | pro |
--      lifetime) → tu fixes l'abo de n'importe qui en 1 clic dans le Table Editor.
--   2. Une vue `admin.members`     → la liste de TOUS les membres (comptes +
--                                     paiements), avec leur statut premium.
--   3. `admin.set_subscription()`  → accorder/forcer un abo (alternative en SQL).
--   4. `admin.revoke_subscription()` → retirer un abo.
--
-- Sécurité : tout vit dans le schéma `admin`, qui n'est PAS exposé par l'API
-- PostgREST (seul `public` l'est). USAGE/EXECUTE sont retirés à `anon` et
-- `authenticated`. Donc aucun utilisateur du site ne peut lire la liste des
-- membres ni s'accorder un abo. Seul le SQL Editor (rôle postgres) y accède.
-- =============================================================================

create schema if not exists admin;

-- -----------------------------------------------------------------------------
-- COLONNE « tier » : UN menu déroulant unique (gratuit | essentiel | pro |
-- lifetime) sur la table `payments`, pour fixer l'abo de n'importe qui en 1 clic
-- dans le Table Editor. Un trigger synchronise dans LES DEUX SENS :
--   • tu changes le menu `tier`            → status/plan_id suivent (l'accès suit) ;
--   • le webhook Whop écrit status/plan_id → `tier` est recalculé tout seul.
-- L'entitlement continue de lire `status='active'` : RIEN à changer côté app,
-- et le webhook n'est pas touché.
-- -----------------------------------------------------------------------------

-- Type énuméré = menu déroulant automatique dans le Table Editor Supabase.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('gratuit', 'essentiel', 'pro', 'lifetime');
  end if;
end $$;

-- La colonne unique à manipuler. Défaut 'gratuit' (= non premium).
alter table public.payments
  add column if not exists tier public.subscription_tier not null default 'gratuit';

-- Synchronisation bidirectionnelle tier <-> status/plan_id. Défensif : aucune
-- conversion qui puisse échouer (donc ne casse jamais l'écriture du webhook).
create or replace function public.sync_payment_tier()
returns trigger
language plpgsql
as $$
declare
  tier_changed boolean;
begin
  if tg_op = 'INSERT' then
    tier_changed := new.tier is distinct from 'gratuit'::public.subscription_tier;
  else
    tier_changed := new.tier is distinct from old.tier;
  end if;

  if tier_changed then
    -- Source = le menu `tier` (édition admin) → on en dérive l'accès.
    if new.tier = 'gratuit' then
      new.status  := 'inactive';
      new.plan_id := null;
    else
      new.status  := 'active';
      new.plan_id := new.tier::text;
    end if;
  else
    -- Source = status/plan_id (webhook Whop) → on recalcule `tier`.
    if new.status = 'active' and new.plan_id in ('essentiel', 'pro', 'lifetime') then
      new.tier := new.plan_id::public.subscription_tier;
    else
      new.tier := 'gratuit';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_sync_tier on public.payments;
create trigger payments_sync_tier
  before insert or update on public.payments
  for each row execute function public.sync_payment_tier();

-- Backfill des lignes existantes (no-op si la table est vide).
update public.payments
set tier = case
  when status = 'active' and plan_id in ('essentiel', 'pro', 'lifetime')
    then plan_id::public.subscription_tier
  else 'gratuit'::public.subscription_tier
end;

-- -----------------------------------------------------------------------------
-- VUE : tous les membres (comptes auth + entitlement payments).
-- FULL OUTER JOIN → on voit aussi : (a) les comptes sans aucun paiement, et
-- (b) les paiements/abos accordés à un email qui n'a pas encore créé de compte.
--
-- DROP IF EXISTS d'abord : `create or replace view` refuse d'INSÉRER une nouvelle
-- colonne au milieu d'une vue existante (ici `tier`). Drop+recréation est sûr,
-- la vue ne dépend que de auth.users + public.payments.
-- -----------------------------------------------------------------------------
drop view if exists admin.members;
create view admin.members as
select
  u.id                                   as user_id,
  coalesce(u.email, p.email)             as email,
  u.created_at                           as account_created,
  u.last_sign_in_at                      as last_sign_in,
  coalesce(p.tier, 'gratuit'::public.subscription_tier) as tier,
  p.plan_id                              as plan_id,
  coalesce(p.status, 'inactive')         as status,
  (p.status = 'active')                  as is_premium,
  p.whop_membership_id                   as whop_membership_id,
  p.current_period_end                   as current_period_end,
  p.updated_at                           as subscription_updated,
  case
    when u.id is null then 'paiement sans compte'
    when p.email is null then 'compte sans abo'
    else 'compte + abo'
  end                                    as kind
from auth.users u
full outer join public.payments p
  on lower(p.email) = lower(u.email)
order by coalesce(u.created_at, p.updated_at) desc nulls last;

-- -----------------------------------------------------------------------------
-- FONCTION : accorder (ou forcer) un abonnement à un email.
-- Usage dans le SQL Editor :
--   select admin.set_subscription('jean@exemple.com');            -- 'pro' par défaut
--   select admin.set_subscription('jean@exemple.com', 'lifetime');
--   select admin.set_subscription('jean@exemple.com', 'essentiel');
-- L'email peut être accordé AVANT que la personne ne crée son compte : dès
-- qu'elle se connecte avec ce même email, elle est premium (match par email).
-- -----------------------------------------------------------------------------
create or replace function admin.set_subscription(
  p_email  text,
  p_plan   text    default 'pro',
  p_active boolean default true
)
returns public.payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.payments;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'email requis';
  end if;
  if p_plan is not null and p_plan not in ('essentiel', 'pro', 'lifetime') then
    raise exception 'plan invalide: % (attendu: essentiel | pro | lifetime)', p_plan;
  end if;

  insert into public.payments (email, plan_id, status, updated_at)
  values (
    lower(trim(p_email)),
    p_plan,
    case when p_active then 'active' else 'canceled' end,
    now()
  )
  on conflict (email) do update
    set plan_id    = excluded.plan_id,
        status     = excluded.status,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- -----------------------------------------------------------------------------
-- FONCTION : retirer un abonnement (le membre repasse non-premium).
-- Usage : select admin.revoke_subscription('jean@exemple.com');
-- -----------------------------------------------------------------------------
create or replace function admin.revoke_subscription(p_email text)
returns public.payments
language sql
security definer
set search_path = public, pg_temp
as $$
  select admin.set_subscription(p_email, null, false);
$$;

-- -----------------------------------------------------------------------------
-- VERROU DE SÉCURITÉ : rien de tout ça n'est accessible aux clients du site.
-- (Le schéma `admin` n'est de toute façon pas exposé par l'API ; ceci est une
--  ceinture + bretelles.)
-- -----------------------------------------------------------------------------
revoke all on schema admin from anon, authenticated;
revoke all on all tables in schema admin from anon, authenticated;
revoke execute on function admin.set_subscription(text, text, boolean) from anon, authenticated, public;
revoke execute on function admin.revoke_subscription(text) from anon, authenticated, public;
