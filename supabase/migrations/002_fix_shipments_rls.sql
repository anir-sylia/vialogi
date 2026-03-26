-- Exécute ce script dans Supabase → SQL Editor (Run).
-- Corrige la plupart des erreurs d’insert depuis la clé `anon` (RLS + GRANT).

-- 1) Table (au cas où elle aurait été créée sans les bonnes colonnes)
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  origin text not null,
  destination text not null,
  weight_kg numeric(12, 3) not null check (weight_kg > 0),
  price numeric(14, 2) not null check (price >= 0)
);

-- 2) RLS activé
alter table public.shipments enable row level security;

-- 3) Supprimer les anciennes politiques (noms du projet Vialogi)
drop policy if exists "shipments_select_anon" on public.shipments;
drop policy if exists "shipments_insert_anon" on public.shipments;

-- 4) Droits SQL — souvent nécessaires en plus des politiques RLS
grant usage on schema public to anon, authenticated;
grant select, insert on table public.shipments to anon, authenticated;

-- 5) Politiques RLS : lecture + insertion pour `anon` et `authenticated`
create policy "shipments_select_anon"
  on public.shipments
  for select
  to anon, authenticated
  using (true);

create policy "shipments_insert_anon"
  on public.shipments
  for insert
  to anon, authenticated
  with check (true);
