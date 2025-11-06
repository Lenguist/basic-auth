This is architecture outline for the first MVP of PaperTrail

Here’s a clean file/folder layout that will scale smoothly through later MVP stages (social, badges, etc.) while keeping this first step simple.

🧱 Project Folder Structure
papertrail/                        ← project root
│
├── app/                           ← Flask app package
│   ├── __init__.py                ← create_app() factory (register blueprints, DB, auth)
│   ├── config.py                  ← environment-specific settings
│   │
│   ├── models/                    ← SQLAlchemy / Supabase models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── paper.py
│   │   └── user_paper.py
│   │
│   ├── routes/                    ← Flask Blueprints
│   │   ├── __init__.py
│   │   ├── main.py                ← landing page, home
│   │   ├── auth.py                ← login/logout (Supabase)
│   │   └── library.py             ← add/remove papers to library
│   │
│   ├── services/                  ← external APIs / logic layer
│   │   ├── __init__.py
│   │   ├── openalex.py            ← handles paper search via OpenAlex API
│   │   └── semantic_scholar.py    ← optional Semantic Scholar integration
│   │
│   ├── templates/                 ← HTML Jinja templates
│   │   ├── base.html
│   │   ├── index.html             ← search + results
│   │   └── library.html           ← user's library
│   │
│   ├── static/                    ← CSS, JS, images
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   └── main.js
│   │   └── img/
│   │
│   ├── extensions.py              ← db, login_manager, etc.
│   └── utils.py                   ← helper functions (e.g., format_author_list)
│
├── migrations/                    ← for Alembic DB migrations
│
├── tests/                         ← pytest unit/integration tests
│   ├── __init__.py
│   └── test_search.py
│
├── .env                           ← API keys, Supabase creds
├── requirements.txt               ← dependencies
├── run.py                         ← entrypoint (flask run wrapper)
├── README.md                      ← project overview / setup steps
└── Dockerfile                     ← optional containerization

🗂 Directory Purpose Summary
Directory	Purpose
app/models/	Database schema (User, Paper, UserPaper)
app/routes/	Flask Blueprints for pages & API endpoints
app/services/	Wrapper classes for Semantic Scholar / OpenAlex API calls
app/templates/	Jinja HTML templates (search, library, login)
app/static/	CSS/JS assets
app/extensions.py	Centralized DB, Supabase client init
app/utils.py	Common helpers
migrations/	Alembic auto-generated DB migrations
tests/	Unit tests