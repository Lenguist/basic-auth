# Nov 5 — Plan of Action (frontend-only MVP)

Scope: Ship login + add-to-library using Supabase (Auth + DB) with no Flask backend.

## Hosting & env
- Frontend: Vercel (Next.js App Router)
- Supabase: single project for Auth + Postgres
- Env vars (Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redirects: set Supabase OAuth callback to Vercel URL `/auth/callback`

## Data model (Supabase)
- `papers` (PK: `openalex_id` text)
  - Columns: `title`, `authors_json`, `year`, `url`, `source`
- `user_papers` (composite unique: `(user_id uuid, openalex_id text)`)
  - Columns: `user_id` (FK `auth.users.id`), `openalex_id` (FK `papers.openalex_id`), `status` (default `to_read`), `inserted_at` (timestamp)

## RLS policies
- `papers`: readable by all; writes allowed to authenticated users (to upsert normalized metadata)
- `user_papers`:
  - Select: `user_id = auth.uid()`
  - Insert: `user_id = auth.uid()` (enforce via policy check)
  - Delete: `user_id = auth.uid()`

## Frontend tasks
1) Auth
- Integrate Supabase client (browser + server if needed)
- Sign in/out UI, session listener, route guard for `/dashboard`

2) Search (OpenAlex direct, no backend)
- Page with search box hitting OpenAlex REST (`/works?search=...`)
- Normalize result fields to our schema
- Render list with "Add to Library" button

3) Add to Library (via supabase-js)
- Upsert into `papers` with `openalex_id` + metadata
- Insert into `user_papers` with `{ user_id: auth.uid(), openalex_id }` (RLS validates)
- Handle duplicate gracefully (treat as success)
- Optimistic UI for added state; fallback error toast

4) Library view
- Query `user_papers` joined to `papers` (FK enables PostgREST join):
  - `from('user_papers').select('openalex_id, inserted_at, papers(*)')`
- List items with title/authors/year and remove action (stretch)

## Deployment checklist
- Set Vercel env vars (URL/key) and Supabase redirect
- Test OAuth flow on production URL
- Verify RLS in production (no cross-user access)

## Stretch (nice-to-have today if time)
- Remove from library (DELETE `user_papers` row)
- Status updates: `to_read → reading → finished`
- Basic rate-limit on client (debounce search)

## Risks & notes
- OpenAlex rate limits: add debounce + simple cache later if needed
- Ensure `user_papers` unique constraint to prevent duplicates
- Token refresh: read latest access token before each fetch


