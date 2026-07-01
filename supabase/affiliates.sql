-- =============================================================================
-- PrediScore — Affiliation (liens influenceurs + tracking + commissions)
-- -----------------------------------------------------------------------------
-- À exécuter dans Supabase → SQL Editor (une fois). Sûr à ré-exécuter.
--
-- Écrit UNIQUEMENT côté serveur (service_role) : middleware (cookie), layout
-- /app (parrainage), webhook Whop (conversion), API de clic, dashboard admin.
-- RLS activée sans aucune policy publique → un visiteur ne peut rien lire ni
-- falsifier. Commission = % du 1er paiement (défaut 30%).
-- =============================================================================

-- Influenceurs / partenaires. `code` = ce qui apparaît dans le lien ?ref=code.
create table if not exists public.affiliates (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text,
  payout_email    text,                              -- email pour le paiement Whop
  commission_rate numeric not null default 0.30,     -- 0.30 = 30% du 1er paiement
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Clics sur les liens d'affiliation (une ligne par visite avec ?ref).
create table if not exists public.affiliate_clicks (
  id         bigint generated always as identity primary key,
  code       text not null,
  ip         text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_clicks_code_idx on public.affiliate_clicks (code);

-- Parrainage : email de l'utilisateur inscrit ← code d'affiliation.
-- Clé = email (comme `payments`) → le webhook relie le paiement au parrain.
create table if not exists public.affiliate_referrals (
  email      text primary key,
  code       text not null,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_referrals_code_idx on public.affiliate_referrals (code);

-- Conversions : 1 ligne par utilisateur payant (son 1er paiement).
create table if not exists public.affiliate_conversions (
  email      text primary key,
  code       text not null,
  plan_id    text,
  amount     numeric,                                -- montant du 1er paiement (€)
  commission numeric,                                -- amount * commission_rate
  created_at timestamptz not null default now()
);
create index if not exists affiliate_conversions_code_idx on public.affiliate_conversions (code);

-- RLS : activée + aucune policy → seul le service_role (serveur) y accède.
alter table public.affiliates            enable row level security;
alter table public.affiliate_clicks      enable row level security;
alter table public.affiliate_referrals   enable row level security;
alter table public.affiliate_conversions enable row level security;

-- Vue agrégée pour le dashboard admin (clics / inscriptions / ventes / commission).
create or replace view public.affiliate_stats as
select
  a.code,
  a.name,
  a.payout_email,
  a.commission_rate,
  a.active,
  coalesce(c.clicks, 0)     as clicks,
  coalesce(r.signups, 0)    as signups,
  coalesce(v.paying, 0)     as paying,
  coalesce(v.revenue, 0)    as revenue,
  coalesce(v.commission, 0) as commission_total
from public.affiliates a
left join (select code, count(*) as clicks from public.affiliate_clicks group by code) c on c.code = a.code
left join (select code, count(*) as signups from public.affiliate_referrals group by code) r on r.code = a.code
left join (
  select code, count(*) as paying, sum(amount) as revenue, sum(commission) as commission
  from public.affiliate_conversions group by code
) v on v.code = a.code;

-- Sécurise la vue : lisible UNIQUEMENT côté serveur (service_role), jamais via
-- l'API publique. Corrige le badge "Unrestricted" de Supabase.
alter view public.affiliate_stats set (security_invoker = on);
revoke all on public.affiliate_stats from anon, authenticated;
