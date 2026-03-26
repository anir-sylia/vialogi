-- Run in Supabase SQL Editor (or via CLI). Creates public.shipments + RLS for anon read/insert.

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  origin text not null,
  destination text not null,
  weight_kg numeric(12, 3) not null check (weight_kg > 0),
  price numeric(14, 2) not null check (price >= 0)
);

create index if not exists shipments_created_at_idx on public.shipments (created_at desc);

comment on table public.shipments is 'Freight listing: origin/destination text, weight (kg), offered price.';

alter table public.shipments enable row level security;

-- MVP: anyone with the anon key can read and create rows. Tighten when auth is ready.
create policy "shipments_select_anon"
  on public.shipments for select
  to anon, authenticated
  using (true);

create policy "shipments_insert_anon"
  on public.shipments for insert
  to anon, authenticated
  with check (true);
