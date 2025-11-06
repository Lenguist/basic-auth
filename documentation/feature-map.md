🧱 MVP Stage 1 — Search + Add to Library

Goal: User can search a paper and save it.
Features:

Landing page with login (Supabase auth).

Search bar that hits Semantic Scholar / OpenAlex API.

“Add to Library” button → stores UserPaper in DB.
Schema touched: User, Paper, UserPaper.
Duration: ~1 week.

🗂 MVP Stage 2 — Library View

Goal: Show saved papers.
Features:

Display list (title, authors, abstract).

Remove / change status (“to read → reading → finished”).
Duration: ~1 week.

👤 MVP Stage 3 — User Profiles

Goal: Public profile page.
Features:

/@username route showing their papers.

Basic avatar + bio + counts.
Duration: ~3 days.

🫱🏽‍🫲🏽 MVP Stage 4 — Follow + Activity Feed

Goal: See friends’ updates.
Features:

“Follow” table + feed aggregation.

Events: added paper, finished paper.
Duration: ~1–1.5 weeks.

⭐ MVP Stage 5 — Ratings + Reviews

Goal: Comment on papers.
Features:

1–5 star rating + short review.

Display reviews on paper page.
Duration: ~1 week.

🏅 MVP Stage 6 — Badges / Achievements

Goal: Introduce fun gamification.
Features:

Rule-based badges (“5 papers this month”).

Show on profile + feed event.
Duration: ~1 week.

🧠 MVP Stage 7 — Recommendations & Discovery

Goal: Add discovery loop.
Features:

“Trending among friends”.

Similar-papers via embedding search (OpenAI or Sentence-Transformers).
Duration: ~2 weeks.

🧪 MVP Stage 8 — Polish & Beta Launch

Goal: Onboard real users.
Features:

Invite flow, simple analytics, feedback form.

Deploy to Vercel + Supabase.
Duration: ~1 week.