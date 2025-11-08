# Nov 8 — Todos Left (Next Actions)

1) Fix public library visibility on profile pages (e.g., Bob’s library not showing)
   - Verify RLS policies on `user_papers` include a public SELECT policy in prod/dev
   - Confirm query in `app/u/[username]/page.tsx` selects `status, papers(*)` and filters by `user_id`
   - Re-seed dev data and hard refresh profile page after pushing migrations

2) Feed polish
   - Group posts by day and condense multiple “added to library” events
   - Link statuses to filtered views (e.g., “Read” → filter=read)

3) Profile polish
   - Add avatar upload via Supabase Storage (and display on profile/feed)
   - Username availability indicator in real time

4) Library UX
   - Inline toasts on status change errors; optimistic UI with rollback
   - Quick remove from library

5) Search improvements
   - Fuzzy search/typo tolerance (e.g., “original vllm paper”)
   - Show richer stats (citations, venue) in results

6) Data integrity
   - Add NOT NULL/length constraints where appropriate
   - Add reserved usernames blocklist

7) Deployment
   - Ensure dev/prod migrations are in sync
   - Verify Vercel envs point to correct Supabase project per environment


