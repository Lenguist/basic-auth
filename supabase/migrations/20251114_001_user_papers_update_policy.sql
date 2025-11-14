-- Add UPDATE policy for user_papers if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_papers' and policyname = 'user_papers update own'
  ) then
    create policy "user_papers update own" on public.user_papers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
