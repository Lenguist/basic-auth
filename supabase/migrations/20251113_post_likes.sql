-- Create post_likes table for recording likes on posts

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  constraint post_likes_unique unique (post_id, user_id)
);

create index if not exists idx_post_likes_post on public.post_likes (post_id);
create index if not exists idx_post_likes_user on public.post_likes (user_id);

alter table public.post_likes enable row level security;

-- Policies: allow public SELECT, allow authenticated users to insert their own like and delete their own like

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'post_likes are publicly readable'
  ) then
    create policy "post_likes are publicly readable"
      on public.post_likes for select
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'user can like posts'
  ) then
    create policy "user can like posts"
      on public.post_likes for insert
      with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'post_likes' and policyname = 'user can remove their like'
  ) then
    create policy "user can remove their like"
      on public.post_likes for delete
      using (auth.uid() = user_id);
  end if;
end $$;
