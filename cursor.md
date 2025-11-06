# Cursor session notes — basic-auth (frontend)

Date: 2025-11-06

## Context
- Role: Next.js App Router frontend for Papertrail.
- Hosting: Vercel.
- Auth: Supabase Auth (OAuth). Frontend holds session and sends `Authorization: Bearer <access_token>` to backend when needed.
- Database: Supabase Postgres (shared with backend). Row Level Security (RLS) enforces per-user access when frontend calls Supabase directly.
- Backend: Papertrail (Flask on Railway) validates Supabase JWT for any backend APIs.

## MVP (today): Login + Add to Library
- Login is entirely via Supabase on the frontend.
- Two viable approaches for "Add to Library":
  - Option A (recommended for MVP): Frontend writes directly to Supabase via `supabase-js` under strict RLS.
    - Tables: `papers` (normalized metadata, keyed by `openalex_id`), `user_papers` (link table with unique `(user_id, openalex_id)`).
    - Frontend upserts into `papers`, inserts into `user_papers`; handle duplicate gracefully.
  - Option B (more control): Frontend calls backend `POST /api/v1/library` with Supabase JWT; backend verifies JWT, upserts `papers`, inserts into `user_papers` (using service role).

## Minimal API surface (if using backend for library or search)
- GET `/api/v1/search?q=&page=` → backend fetches from OpenAlex/Semantic Scholar and normalizes.
- GET `/api/v1/library` → list user’s saved papers.
- POST `/api/v1/library` → add paper; dedupe on `(user_id, openalex_id)`.
- DELETE `/api/v1/library/:openalex_id` → remove association.

## Security & integration
- Always send the latest Supabase `access_token` as Bearer.
- Backend verifies JWT with Supabase JWKS; derives `supabase_user_id` for DB operations.
- CORS: allow Vercel origin, headers `Authorization, Content-Type`.

## Config
- Frontend env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE_URL` (if calling backend).
- Token refresh: rely on Supabase auto-refresh; read fresh token before each fetch.

## Git status (for context)
- Branches: `main` (current), `bare-minimum` (captures initial notes in `dev-plan.md`).

## Next steps
- Decide Option A vs B for library writes (start with A for speed).
- If using backend: implement JWT verification and CORS; expose minimal endpoints above.
- Add RLS policies for `papers`/`user_papers`; ensure unique constraint and input validation.


