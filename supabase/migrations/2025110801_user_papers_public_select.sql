-- Make user libraries publicly readable for profile pages
-- Adds an additional SELECT policy that allows anyone to read user_papers
-- (In addition to existing self-only policies for inserts/updates/deletes)

alter table public.user_papers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_papers'
      and policyname = 'user_papers select public'
  ) then
    create policy "user_papers select public"
      on public.user_papers for select
      to anon, authenticated
      using (true);
  end if;
end $$;


