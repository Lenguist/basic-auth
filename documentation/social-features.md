# Social Features (MVP) — Plan and Required Changes

Goal: Let users follow each other and view public libraries. All accounts are open/public by default; no approvals needed.

## User stories
- As a user, I can set a public profile with a unique username.
- As a user, I can visit `/u/[username]` to see someone’s profile and their library.
- As a user, I can follow/unfollow another user.
- As a user, I can see my follower and following counts.

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

## UI updates
- Navbar: add “Profile” link when signed in; optional small avatar chip.
- Library/List styling: reuse current cards; add subtle metadata chips.
- Follow button: optimistic toggle with disabled state during requests.

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
2) `supabase db push` to dev then prod.
3) Implement `/profile` and `/u/[username]` pages.
4) Add Follow button and wire counts.
5) Add navbar “Profile” link and ensure profile upsert on first login.
6) QA public view (incognito): profile page and library visibility.

## Risks / mitigations
- Missing profile rows: upsert on first authenticated view.
- Username collisions: enforce `lower(username)` unique index; show availability in UI.
- Library privacy: this MVP is “public by default.” Private accounts/follow requests can be added later.


