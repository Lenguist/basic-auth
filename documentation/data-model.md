Here’s the complete data model plan for your “Goodreads/Strava for research papers” app — structured for incremental MVP buildout and scalable to later social/gamified features.

🧩 Core Entities
1. User

Represents a registered person using the app.

Field	Type	Notes
id	UUID	Primary key
username	String	Unique handle (for /@username profile)
email	String	Unique
password_hash	String	Managed by auth provider (e.g. Supabase)
name	String	Display name
bio	Text	Short profile blurb
avatar_url	String	Profile picture
created_at	Timestamp	
updated_at	Timestamp	
2. Paper

Core unit — represents a research paper from arXiv, Semantic Scholar, etc.

Field	Type	Notes
id	UUID	Primary key
doi	String	Optional, unique if present
arxiv_id	String	Optional
title	String	
abstract	Text	
authors	JSON	List of author names or objects
publication_date	Date	
venue	String	Journal / conference
url	String	Canonical link (arXiv, DOI, etc.)
tags	JSON	Subject areas / user tags
citation_count	Integer	(Optional, from API)
metadata_source	Enum(semantic_scholar, openalex, etc.)	
created_at	Timestamp	
3. UserPaper

Join table linking a user and a paper (like Goodreads’ “shelf” entry).

Field	Type	Notes
id	UUID	Primary key
user_id	FK → User.id	
paper_id	FK → Paper.id	
status	Enum(to_read, reading, finished)	Shelf status
rating	Integer (1–5)	Optional
review	Text	Optional short comment
progress	Float	Percent read (0.0–1.0)
updated_at	Timestamp	Used for feed events

Index suggestion: (user_id, paper_id) unique.

🧑‍🤝‍🧑 Social Entities
4. Follow

Defines the social graph (followers/following).

Field	Type	Notes
id	UUID	Primary key
follower_id	FK → User.id	
following_id	FK → User.id	
created_at	Timestamp	

Index: (follower_id, following_id) unique.

5. FeedEvent

Stores what appears on your social feed.

Field	Type	Notes
id	UUID	Primary key
user_id	FK → User.id	
type	Enum(added_paper, finished_paper, reviewed_paper, earned_badge)	
paper_id	FK → Paper.id	Optional
metadata	JSON	Extra info (e.g. rating, badge name)
created_at	Timestamp	

Each time a UserPaper changes status or review, insert a FeedEvent.

🏅 Gamification Entities
6. Badge

Static definition of achievements.

Field	Type	Notes
id	UUID	Primary key
name	String	e.g. “First Paper Read”, “ML Explorer”
description	Text	
icon_url	String	Badge image
criteria	JSON	Rule definition (papers ≥ 5, tag == “AI”, etc.)
7. UserBadge

Which badges a user has earned.

Field	Type	Notes
id	UUID	Primary key
user_id	FK → User.id	
badge_id	FK → Badge.id	
earned_at	Timestamp	
💬 Optional Add-ons (for later MVPs)
8. Comment

If you later allow replies under reviews.

Field	Type	Notes
id	UUID	
user_id	FK → User.id	
paper_id	FK → Paper.id	
parent_id	FK → Comment.id	Optional (threaded replies)
text	Text	
created_at	Timestamp	
9. RecommendationCache

Precomputed recommended papers per user.

Field	Type	Notes
user_id	FK → User.id	
recommendations	JSON	List of paper IDs or metadata
updated_at	Timestamp	
🧱 MVP-by-MVP Evolution
MVP	New Tables Used	Description
#1 Search + Add	User, Paper, UserPaper	Basic save & shelf
#2 Library View	UserPaper	Add statuses, progress
#3 Profiles	User	Public data
#4 Social Feed	Follow, FeedEvent	Follow + events
#5 Reviews	UserPaper.review, rating	Ratings/comments
#6 Badges	Badge, UserBadge	Gamification
#7 Recommendations	RecommendationCache	Suggested reads