-- Tables: papers, user_papers

create table if not exists public.papers (
  openalex_id text primary key,
  title text not null,
  authors_json jsonb,
  year int,
  url text,
  source text,
  inserted_at timestamptz default now()
);

create table if not exists public.user_papers (
  user_id uuid not null references auth.users(id) on delete cascade,
  openalex_id text not null references public.papers(openalex_id) on delete cascade,
  status text default 'to_read',
  inserted_at timestamptz default now(),
  unique (user_id, openalex_id)
);

-- Helpful index for ordering/filtering
create index if not exists idx_user_papers_user_inserted
  on public.user_papers (user_id, inserted_at desc);

-- Enable RLS
alter table public.papers enable row level security;
alter table public.user_papers enable row level security;

-- Policies for papers (shared metadata): allow reads to everyone, writes to authenticated
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'papers' and policyname = 'papers select for all'
  ) then
    create policy "papers select for all" on public.papers for select to anon, authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'papers' and policyname = 'papers insert for authenticated'
  ) then
    create policy "papers insert for authenticated" on public.papers for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'papers' and policyname = 'papers update for authenticated'
  ) then
    create policy "papers update for authenticated" on public.papers for update to authenticated using (true) with check (true);
  end if;
end $$;

-- Policies for user_papers (user-owned rows)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_papers' and policyname = 'user_papers select own'
  ) then
    create policy "user_papers select own" on public.user_papers for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_papers' and policyname = 'user_papers insert own'
  ) then
    create policy "user_papers insert own" on public.user_papers for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_papers' and policyname = 'user_papers delete own'
  ) then
    create policy "user_papers delete own" on public.user_papers for delete to authenticated using (user_id = auth.uid());
  end if;
end $$;


