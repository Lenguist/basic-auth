-- Create a trigger that writes a 'user_joined' event to posts when a profile is created.
-- Safe to run multiple times (checks for existence).

-- Ensure posts table exists with required columns (created earlier in 20251108_social.sql).

create or replace function public.fn_profile_after_insert_user_joined()
returns trigger
language plpgsql
as $$
begin
  -- Insert an activity row for the newly created profile owner.
  insert into public.posts (user_id, type)
  values (new.id, 'user_joined');
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    if not exists (
      select 1 from pg_trigger
      where tgname = 'trg_profile_after_insert_user_joined'
    ) then
      create trigger trg_profile_after_insert_user_joined
        after insert on public.profiles
        for each row
        execute procedure public.fn_profile_after_insert_user_joined();
    end if;
  end if;
end
$$;



