# Nov 8 — Completed Work (Summary)

- Rebrand UI and theme, updated navbar and hero.
- Frontend-only MVP solidified (Supabase auth + DB, no Flask).
- Supabase migrations:
  - `papers`, `user_papers` with RLS and status CHECK (`to_read`, `reading`, `read`).
  - Social: `profiles`, `follows`, `posts` with RLS and indexes.
  - Public SELECT policy for `user_papers` to enable profile library views.
- Profile features:
  - `/profile` page to set `username`, `display_name`, `bio` (avatar postponed).
  - Auto-create profile row for new users.
- Public profiles:
  - `/u/[username]` with follow/unfollow, follower/following counts and lists.
  - Library view with status filters (All, To Read, Reading, Read).
- Feed:
  - `/feed` showing “added to library” and “status changed” events from followed users and self.
  - Posts written automatically on add-to-library and status changes.
- Library:
  - Status change controls with optimistic UI; feed post on change.
- Seed script:
  - `npm run seed:dev` creates demo users (alice, bob, charlie, david, elaine), profiles, follows, random papers with varied statuses, and posts.
- Deploy/config:
  - Vercel prod live; guidance provided for env separation and Supabase dev/prod setup.


