begin;
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  weight_kg numeric(7,3) not null check (weight_kg >= 1 and weight_kg <= 700),
  unit text not null default 'lb' check (unit in ('lb', 'kg')),
  measured_on date not null check (measured_on between date '1900-01-01' and date '2100-12-31'),
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index weight_entries_user_date on public.weight_entries (user_id, measured_on desc, created_at desc, id desc);
alter table public.weight_entries enable row level security;
alter table public.weight_entries force row level security;
revoke all on public.weight_entries from anon, authenticated;
grant select, insert, update, delete on public.weight_entries to authenticated;
create policy "Read own entries" on public.weight_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own entries" on public.weight_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own entries" on public.weight_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own entries" on public.weight_entries for delete to authenticated using ((select auth.uid()) = user_id);
commit;
