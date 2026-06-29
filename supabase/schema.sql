-- =============================================================================
-- PrediScore — Schéma Supabase (abonnements + quotas + historique)
-- -----------------------------------------------------------------------------
-- À exécuter dans Supabase → SQL Editor (une fois). Sûr à ré-exécuter.
--
-- L'identité vient de Supabase Auth. Le statut premium est uniquement décidé
-- côté serveur par `payments`, puis les quotas journaliers sont verrouillés via
-- `daily_usage`. Les analyses déjà calculées sont sauvegardées dans
-- `analysis_history` pour éviter de repayer une génération sur le même match.
-- =============================================================================

-- updated_at automatique.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- payments — entitlement premium (Whop + admin Supabase).
-- Écrit par le webhook Whop (service_role) OU par toi depuis le Table Editor
-- Supabase via la colonne `tier`. Un utilisateur du site NE PEUT PAS se rendre
-- premium : aucune policy insert/update/delete n'est ouverte côté client.
-- Clé = email : on relie le membre Whop au compte Supabase par son email.
-- =============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('gratuit', 'essentiel', 'pro', 'lifetime');
  end if;
end $$;

create table if not exists public.payments (
  email              text primary key,
  plan_id            text,               -- 'essentiel' | 'pro' | 'lifetime'
  tier               public.subscription_tier not null default 'gratuit',
  status             text not null default 'inactive',  -- 'active' | 'canceled' | 'inactive'
  whop_membership_id text,
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.payments
  add column if not exists tier public.subscription_tier not null default 'gratuit';

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
    -- Source = édition manuelle dans Supabase Table Editor.
    if new.tier = 'gratuit' then
      new.status := 'inactive';
      new.plan_id := null;
    else
      new.status := 'active';
      new.plan_id := new.tier::text;
    end if;
  else
    -- Source = webhook Whop ou écriture serveur plan_id/status.
    if new.status = 'active' and new.plan_id in ('essentiel', 'pro', 'lifetime') then
      new.tier := new.plan_id::public.subscription_tier;
    else
      new.tier := 'gratuit';
    end if;
  end if;

  new.updated_at := coalesce(new.updated_at, now());
  return new;
end;
$$;

drop trigger if exists payments_sync_tier on public.payments;
create trigger payments_sync_tier
  before insert or update on public.payments
  for each row execute function public.sync_payment_tier();

update public.payments
set tier = case
  when status = 'active' and plan_id in ('essentiel', 'pro', 'lifetime')
    then plan_id::public.subscription_tier
  else 'gratuit'::public.subscription_tier
end;

alter table public.payments enable row level security;

-- Lecture : l'utilisateur voit son propre entitlement (match sur l'email du JWT).
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Aucune policy insert/update/delete pour les utilisateurs : seules les écritures
-- via service_role (le webhook) passent. Premium = vérité serveur, infalsifiable.

-- =============================================================================
-- daily_usage — quotas journaliers PrediScore.
-- Écrit côté serveur avec service_role après vérification de session :
--   • Essentiel : 1 analyse complète / jour
--   • Pro       : analyses illimitées + 1 question Coach IA / jour
--   • Lifetime  : illimité
-- =============================================================================
create table if not exists public.daily_usage (
  email          text not null,
  day            date not null default current_date,
  analysis_count integer not null default 0,
  coach_count    integer not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (email, day)
);

alter table public.daily_usage enable row level security;

drop policy if exists "daily_usage_select_own" on public.daily_usage;
create policy "daily_usage_select_own" on public.daily_usage
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Pas de policy insert/update/delete côté utilisateur : seuls les route handlers
-- serveur écrivent via service_role, donc le quota n'est pas falsifiable côté client.

-- Incrément atomique des quotas journaliers.
-- Le code serveur refuse l'action si cette fonction n'existe pas : ça évite les
-- doubles consommations simultanées sur les plans limités.
create or replace function public.consume_daily_usage(
  p_email text,
  p_kind text,
  p_limit integer
)
returns table (
  allowed boolean,
  analysis_count integer,
  coach_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.daily_usage%rowtype;
begin
  if v_email is null or length(v_email) = 0 then
    raise exception 'email requis';
  end if;
  if p_kind not in ('analysis', 'coach') then
    raise exception 'kind invalide: %', p_kind;
  end if;
  if p_limit < 0 then
    raise exception 'limit invalide: %', p_limit;
  end if;

  insert into public.daily_usage (email, day, analysis_count, coach_count, updated_at)
  values (v_email, current_date, 0, 0, now())
  on conflict (email, day) do nothing;

  select *
  into v_row
  from public.daily_usage
  where email = v_email and day = current_date
  for update;

  if p_kind = 'analysis' then
    if v_row.analysis_count >= p_limit then
      return query select false, v_row.analysis_count, v_row.coach_count;
      return;
    end if;

    update public.daily_usage
    set analysis_count = analysis_count + 1,
        updated_at = now()
    where email = v_email and day = current_date
    returning * into v_row;
  else
    if v_row.coach_count >= p_limit then
      return query select false, v_row.analysis_count, v_row.coach_count;
      return;
    end if;

    update public.daily_usage
    set coach_count = coach_count + 1,
        updated_at = now()
    where email = v_email and day = current_date
    returning * into v_row;
  end if;

  return query select true, v_row.analysis_count, v_row.coach_count;
end;
$$;

revoke execute on function public.consume_daily_usage(text, text, integer) from anon, authenticated, public;
grant execute on function public.consume_daily_usage(text, text, integer) to service_role;

-- =============================================================================
-- analysis_history — analyses complètes déjà calculées.
-- Permet de revoir une analyse et d'éviter un nouveau coût IA/API si le même
-- utilisateur relance le même match.
-- =============================================================================
create table if not exists public.analysis_history (
  id          bigserial primary key,
  email       text not null,
  fixture_id  bigint not null,
  fixture_date timestamptz,
  home_name   text not null,
  away_name   text not null,
  league_name text,
  payload     jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (email, fixture_id)
);

alter table public.analysis_history
  add column if not exists fixture_date timestamptz,
  add column if not exists home_name text,
  add column if not exists away_name text,
  add column if not exists league_name text,
  add column if not exists payload jsonb;

alter table public.analysis_history enable row level security;

drop policy if exists "analysis_history_select_own" on public.analysis_history;
create policy "analysis_history_select_own" on public.analysis_history
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop trigger if exists analysis_history_set_updated_at on public.analysis_history;
create trigger analysis_history_set_updated_at
  before update on public.analysis_history
  for each row execute function public.set_updated_at();

create index if not exists analysis_history_email_created_idx
  on public.analysis_history (lower(email), created_at desc);

create index if not exists analysis_history_email_fixture_idx
  on public.analysis_history (lower(email), fixture_id);
