# Basic Social — Plan (Follow people, view their libraries)

Goal: Add lightweight social features so users can follow each other and view each other’s libraries. All accounts are public by default.

## UX scope (MVP)
- Profile
  - Public profile at `/u/[username]` showing: display name, avatar, follower/following counts, and the user’s Library (latest saved papers).
  - Self profile management at `/profile` to choose a unique `username` and basic fields (display name, bio, avatar).
- Follow
  - On a profile page, show Follow/Unfollow button for the viewed user.
  - Following is open (no approvals). Duplicates prevented.
- Navigation
  - Navbar “Profile” link when signed in.
  - From any username mention (e.g. in future feeds), link to `/u/[username]`.

## Data model (Supabase)
We’ll keep using a frontend-only approach via supabase-js with strict RLS.

Tables to add:

1) `profiles` — user-visible info, 1:1 with `auth.users`
- `id uuid primary key` (same as `auth.users.id`)
- `username text unique` (case-insensitive unique, enforced via an index)
- `display_name text`
- `bio text`
- `avatar_url text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

2) `follows` — directed edges for the social graph
- `follower_id uuid not null references auth.users(id) on delete cascade`
- `following_id uuid not null references auth.users(id) on delete cascade`
- `created_at timestamptz default now()`
- `unique (follower_id, following_id)`
- Indexes:
  - `idx_follows_follower` on `(follower_id)`
  - `idx_follows_following` on `(following_id)`

Notes:
- On first authenticated interaction, ensure a `profiles` row exists for the user (created lazily on the client if missing).
- Prevent self-follow via a CHECK constraint or client-side guard; we can enforce with a constraint: `check (follower_id <> following_id)`.

## RLS policies (high-level)
Enable RLS on both tables.

- `profiles`
  - SELECT: everyone (public profiles)
  - INSERT: only `auth.uid() = new.id` (self on first write)
  - UPDATE: only `auth.uid() = id` (edit own profile fields)

- `follows`
  - SELECT: everyone (public follower/following counts)
  - INSERT: only when `auth.uid() = follower_id`
  - DELETE: only when `auth.uid() = follower_id` (unfollow)

This allows public reads while restricting writes to the authenticated owner(s).

Example SQL (for later migration; do not run yet):

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Ensure case-insensitive uniqueness for username (optional enhancement):
create unique index if not exists profiles_username_ci_unique on public.profiles (lower(username));

-- follows
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  constraint follows_unique unique (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists idx_follows_follower on public.follows (follower_id);
create index if not exists idx_follows_following on public.follows (following_id);

alter table public.follows enable row level security;

create policy "follows are publicly readable"
  on public.follows for select
  using (true);

create policy "user can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "user can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);
```

## Frontend responsibilities (no backend)
- Session handling remains the same via Supabase Auth.
- All reads/writes go through `supabase-js` to `profiles` and `follows` under RLS.
- On sign-in or first navigation, upsert/create the `profiles` row if missing:
  - Prompt user to choose a `username` on `/profile` if not set.

### Pages/components to add
- `app/profile/page.tsx`
  - View and edit own `display_name`, `bio`, `avatar_url`, and pick/set `username` (unique).
  - Validate username: slug-safe, length limits; check availability with `select` on `profiles` using `lower(username)`.

- `app/u/[username]/page.tsx` (public profile)
  - Fetch profile by `username`.
  - Show Follow/Unfollow button if viewing someone else; disabled for self.
  - Show follower/following counts:
    - followers: `count(*) where following_id = profile.id`
    - following: `count(*) where follower_id = profile.id`
  - Show Library list for the user (join `user_papers` → `papers`) ordered by `inserted_at desc`.

- Follow button logic
  - Determine following state with `select` on `follows` for `(follower_id = me, following_id = profile.id)`.
  - Toggle: insert or delete that row. Handle unique constraint races by treating duplicate insert as success.

### Queries (sketch)
- Get profile by username:
```ts
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', username)  // or use lower(username)
  .single();
```

- Counts:
```ts
const [{ count: followers }, { count: following }] = await Promise.all([
  supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
  supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
]);
```

- Library for a user:
```ts
const { data: library } = await supabase
  .from('user_papers')
  .select('openalex_id, inserted_at, papers(*)')
  .eq('user_id', profile.id)
  .order('inserted_at', { ascending: false });
```

- Follow / Unfollow:
```ts
// Follow
await supabase.from('follows').insert([{ follower_id: me.id, following_id: profile.id }]);
// Unfollow
await supabase.from('follows').delete().match({ follower_id: me.id, following_id: profile.id });
```

## UI changes
- Navbar: when signed in, add a “Profile” link to `/profile` and optionally show the user’s avatar.
- Profile page: simple form with branded buttons; show live username availability feedback.
- Public profile: hero header with avatar/name; Follow button; tabs/pills for Library (and later, Activity).

## Validation and constraints
- Username
  - Required for public profile URL; slug-safe (`^[a-z0-9_\\.]{3,20}$`).
  - Case-insensitive uniqueness via `lower(username)` index.
  - Reserve future system paths (`auth`, `u`, `api`, etc.). Enforce in UI; optionally add a constraint table to block reserved names.
- Follow
  - Prevent self-follow (constraint).
  - Unique pairs enforced by `unique (follower_id, following_id)`.

## Security
- All reads public; writes bound to `auth.uid()` via RLS.
- Do not expose service roles in the client.
- Rate-limit follow toggles client-side (debounce/disable while pending); add server-side later if needed.

## Migration checklist (to run later)
1) Create tables `profiles` and `follows` (+ indexes + constraints).
2) Enable RLS and add policies from the SQL above.
3) Optionally backfill `profiles` for existing users (`insert into profiles (id) select id from auth.users ... on conflict do nothing`).

## Rollout plan
- Step 1: Migrations to prod/dev via Supabase CLI (`supabase db push`).
- Step 2: Implement `/profile` and `/u/[username]` pages, and a minimal `FollowButton`.
- Step 3: Add navbar links and profile creation prompt for first-time users.
- Step 4: Polish (avatars, better list styles, 404 for unknown usernames).

## Future extensions (not in this MVP)
- Private accounts and follow requests.
- Activity feed and notifications.
- Suggested people to follow (mutuals), search by name/username.
- Import avatar/name from OAuth providers.


