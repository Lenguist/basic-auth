# Social Features (MVP) — Plan and Required Changes

Goal: Let users follow each other and view public libraries. All accounts are open/public by default; no approvals needed.

## User stories
- As a user, I can set a public profile with a unique username.
- As a user, I can visit `/u/[username]` to see someone’s profile and their library.
- As a user, I can follow/unfollow another user.
- As a user, I can see my follower and following counts.
- As a user, I have a personal feed showing recent updates from people I follow (e.g., papers they added or finished).

## Data model (Supabase)
Keep frontend-only (supabase-js) with strict RLS.

Tables to add:
1) `profiles` (1:1 with `auth.users`)
- `id uuid primary key` (FK → `auth.users.id`)
- `username text unique` (case-insensitive unique; enforce via `unique index on lower(username)`)
- `display_name text`
- `bio text`
- `avatar_url text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

2) `follows` (directed relation)
- `follower_id uuid not null` (FK → `auth.users.id` on delete cascade)
- `following_id uuid not null` (FK → `auth.users.id` on delete cascade)
- `created_at timestamptz default now()`
- Constraints:
  - `unique (follower_id, following_id)`
  - `check (follower_id <> following_id)`
- Indexes:
  - `idx_follows_follower (follower_id)`
  - `idx_follows_following (following_id)`

We will continue using the existing `papers` + `user_papers` to show a user’s library.

3) `posts` (activity items for feeds; minimal for MVP)
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null` (FK → `auth.users.id` on delete cascade)
- `type text not null` — enum-like values for MVP:
  - `added_to_library` (when a user adds a paper)
  - `status_changed` (when a user changes status)
  - `reviewed` (optional later)
- `openalex_id text` (nullable; present for library/status events)
- `status text` (nullable; new status when `type = 'status_changed'`)
- `rating int` (nullable; for reviews later, 0–5)
- `note text` (nullable; short review)
- `created_at timestamptz default now()`
- Indexes:
  - `idx_posts_user_created (user_id, created_at desc)`
  - `idx_posts_openalex (openalex_id)`

## RLS policies (high-level)
Enable RLS on both tables.

- `profiles`
  - SELECT: public (`using (true)`)
  - INSERT: self-only (`with check (auth.uid() = id)`)
  - UPDATE: self-only (`using (auth.uid() = id) with check (auth.uid() = id)`)

- `follows`
  - SELECT: public (`using (true)`) — follower and following counts are public
  - INSERT: only the actor can follow (`with check (auth.uid() = follower_id)`)
  - DELETE: only the actor can unfollow (`using (auth.uid() = follower_id)`)

Note: We can keep libraries public by relying on existing `user_papers` select policies; to show someone else’s library we’ll query by their `user_id`.

- `posts`
  - SELECT: public (`using (true)`) — feeds are public for now
  - INSERT: only owner (`with check (auth.uid() = user_id)`)
  - DELETE/UPDATE: owner only (not needed for MVP but safe to add)

## Pages and routes
- `/profile` (private)
  - Create/update `profiles` row for the current user.
  - Edit `display_name`, `bio`, `avatar_url`.
  - Choose/set `username` (unique). Validate availability via `select` on `profiles`.
- `/u/[username]` (public)
  - Fetch profile by `username`. Show avatar, display name, bio.
  - Show Follow/Unfollow button (hidden/disabled when viewing own profile).
  - Show follower/following counts (HEAD selects with `count: 'exact'`).
  - Show public library: `user_papers` joined to `papers`, filtered by `user_id` of the profile.
- `/feed` (private)
  - Reverse‑chronological list of `posts` from people I follow (and optionally my own posts).
  - For MVP, show cards like “X added ‘Title’ to To Read” or “X finished ‘Title’”.

## UI updates
- Navbar: add “Profile” link when signed in; optional small avatar chip.
- Library/List styling: reuse current cards; add subtle metadata chips.
- Follow button: optimistic toggle with disabled state during requests.
- Feed: simple vertical list, grouped by day; avatar + username + action + paper metadata; “Like/Comment” deferred.

## Client logic (supabase-js sketches)
- Ensure profile exists (on first run after login):
```ts
const { data: me } = await supabase.auth.getUser();
await supabase.from('profiles').upsert([{ id: me.user.id }], { onConflict: 'id' });
```
- Load profile by username:
```ts
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', username) // or lower(username) equality
  .single();
```
- Follower/following counts (HEAD):
```ts
const [{ count: followers }, { count: following }] = await Promise.all([
  supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
  supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
]);
```
- Follow/unfollow:
```ts
// Follow
await supabase.from('follows').insert([{ follower_id: me.user.id, following_id: profile.id }]);
// Unfollow
await supabase.from('follows').delete().match({ follower_id: me.user.id, following_id: profile.id });
```
- Public library for a user:
```ts
const { data: library } = await supabase
  .from('user_papers')
  .select('openalex_id, inserted_at, papers(*)')
  .eq('user_id', profile.id)
  .order('inserted_at', { ascending: false });
```

- Create post on add-to-library / status change:
```ts
await supabase.from('posts').insert([{
  user_id: me.user.id,
  type: 'added_to_library',
  openalex_id,
}]);
```

- Feed query (people I follow):
```ts
const { data: feed } = await supabase
  .from('posts')
  .select('*')
  .in('user_id', supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', me.user.id) as any) // or do in two queries on client
  .order('created_at', { ascending: false })
  .limit(50);
```

## Validation
- Username: slug-safe (`^[a-z0-9_\\.]{3,20}$`), case-insensitive unique via `lower(username)` index.
- Reserved names: prevent `auth`, `api`, `u`, `profile`, etc. (UI check first; optional DB constraint later).
- Self-follow: blocked by DB constraint and UI.

## Security and abuse
- Public reads by design; write ops always bound to `auth.uid()`.
- Rate-limit follow toggles on the client (disable button during flight). Consider server-side limits later.
- Avatar URLs: accept only HTTPS; sanitize displayed bio text.

## Rollout checklist
1) Add migrations for `profiles` and `follows` (tables, indexes, constraints, RLS policies).
2) Add migration for `posts` and its policies.
3) `supabase db push` to dev then prod.
4) Implement `/profile` and `/u/[username]` pages.
5) Add Follow button and wire counts.
6) Implement `/feed` and write post on add/status change.
7) Add navbar “Profile” (and optionally “Feed”) link; ensure profile upsert on first login.
8) QA public view (incognito): profile page and library visibility.

## Risks / mitigations
- Missing profile rows: upsert on first authenticated view.
- Username collisions: enforce `lower(username)` unique index; show availability in UI.
- Library privacy: this MVP is “public by default.” Private accounts/follow requests can be added later.
- Feed volume: start with a simple cap (latest 100) and add pagination later.

## Status taxonomy (library lists)
- Use `user_papers.status` with three values: `to_read`, `reading`, `read` (rename “finished” → `read` for consistency).
- Migrations:
  - Add a CHECK constraint: `status in ('to_read','reading','read')`.
  - Keep default: `to_read`.
- UI filters:
  - Library tabs or chips to switch between the three lists.
  - Quick actions to mark “Start Reading” / “Finish” that also create a `posts` entry.

