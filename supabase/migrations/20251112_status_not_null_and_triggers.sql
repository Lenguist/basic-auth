-- 1) Ensure user_papers.status is NOT NULL and constrained
update public.user_papers set status = 'to_read' where status is null;
alter table public.user_papers alter column status set default 'to_read';
alter table public.user_papers alter column status set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_papers_status_valid'
  ) then
    alter table public.user_papers
      add constraint user_papers_status_valid
      check (status in ('to_read','reading','read'));
  end if;
end $$;

-- 2) Extend posts with optional target_user_id (for follow events)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'posts'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'target_user_id'
    ) then
      alter table public.posts
        add column target_user_id uuid references auth.users(id) on delete cascade;
    end if;
  end if;
end $$;


-- 3) Trigger: AFTER INSERT on user_papers -> posts(added_to_shelf)
create or replace function public.fn_user_papers_after_insert_added()
returns trigger
language plpgsql
as $$
begin
  insert into public.posts (user_id, type, openalex_id, status)
  values (new.user_id, 'added_to_shelf', new.openalex_id, new.status);
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_user_papers_after_insert_added'
  ) then
    create trigger trg_user_papers_after_insert_added
      after insert on public.user_papers
      for each row
      execute procedure public.fn_user_papers_after_insert_added();
  end if;
end $$;

-- 4) Trigger: AFTER UPDATE OF status on user_papers -> posts(status_changed)
-- Deletes old status_changed posts for this paper and creates a new one
create or replace function public.fn_user_papers_after_update_status()
returns trigger
language plpgsql
as $$
begin
  if (old.status is distinct from new.status) then
    -- Delete previous status_changed posts for this user and paper
    delete from public.posts
    where user_id = new.user_id
      and type = 'status_changed'
      and openalex_id = new.openalex_id;
    
    -- Create the new status_changed post
    insert into public.posts (user_id, type, openalex_id, status)
    values (new.user_id, 'status_changed', new.openalex_id, new.status);
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_user_papers_after_update_status'
  ) then
    create trigger trg_user_papers_after_update_status
      after update of status on public.user_papers
      for each row
      execute procedure public.fn_user_papers_after_update_status();
  end if;
end $$;

-- 5) Trigger: AFTER INSERT on follows -> posts(followed)
create or replace function public.fn_follows_after_insert_followed()
returns trigger
language plpgsql
as $$
begin
  insert into public.posts (user_id, type, target_user_id)
  values (new.follower_id, 'followed', new.following_id);
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_follows_after_insert_followed'
  ) then
    create trigger trg_follows_after_insert_followed
      after insert on public.follows
      for each row
      execute procedure public.fn_follows_after_insert_followed();
  end if;
end $$;


