Nov 8

to add demo users on dev
cd /Users/mbondarenko/Desktop/papertrail-main
export SUPABASE_URL="https://<DEV_REF>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
npm run seed:dev

Nov 6th update
Got basic node js frontned only version to work. Will rewordk my environment and set up before furhter iteration.
Rename branch
Create Prod and Dev supabase environments

Nov 5th update

Okay it's been a while. I had to take a week long hiatus bc of school work to catch up on. Last thing I did was get stuck with auth with just flask, and I realized that i probably need to build out frontend to make my life easier with supabase. Then I learned about magic links nad how that would probably work with flask, but eithe way i think having a seprarate frontned on node js presents long temr advantages. SO then i ovecomplicated it for myself ofc and decided i will create *the grand template* conssiting of basic auth + supabase + basic backend + supabase database. Then Veroniak reminded me that while i am doing all fo that i am not actually making any progress on the project. So i was like you know you are right. So tonight basic-auth becomes just papertrail frontend.

Additionally had a couple really good ideas for new features. I will drop them into ideas.md long term but for now will just drop here.

Maksym Bondarenko, [11/5/25 7:02 PM]
Search for paper add to the library review

Maksym Bondarenko, [11/5/25 7:02 PM]
Stats
Papers read this month
Your top arsss
Your papers embedding

Maksym Bondarenko, [11/5/25 11:23 PM]
read kimi k2

Maksym Bondarenko, [11/5/25 11:23 PM]
add featuyre atoadd paper to read later

Maksym Bondarenko, [11/5/25 11:23 PM]
and that it shows you reminders or other poeple who wanted to read that paper in your network

Maksym Bondarenko, [11/5/25 11:23 PM]
BUILD this

Maksym Bondarenko, [11/5/25 11:23 PM]
this is so cool

Maksym Bondarenko, [11/5/25 11:26 PM]
add a ranker

Maksym Bondarenko, [11/5/25 11:26 PM]
of top papers

Maksym Bondarenko, [11/5/25 11:26 PM]
so you have either toime what to read

Maksym Bondarenko, [11/5/25 11:27 PM]
also fins that arxiv all knowledge library embedding

Maksym Bondarenko, [11/5/25 11:27 PM]
and youcan highlight which "stars" you explored

Maksym Bondarenko, [11/5/25 11:27 PM]
and add constellation names and shit like that

Maksym Bondarenko, [11/5/25 11:27 PM]
really gamify reading papres
Anyway back to work now. Will try to combine frotnend and backend today in some simpel way.

Oct 25, 2025 This is the first entry in dev log for paper trail (goodreads for papers)

Idea came to me first through Veronika, and then again when I was thinkign about how being able to track progress on # of papers read can help with motivation and consistency reading papers

Esp since in other places in my life tracking progress and social feature had huge impact. For example strava and goodreads.

Additionally I thoguht this is a good thing for me to biuld since I have a lot of researcher friends, and even those who are not reseearchers all read papers.

In general, prettymuch *everyone* recognized the arxiv shirt. So everyone spends time there, everyone has the experience of printing a paper to read it, etc. So why not make it a more social activity?

I then asked chatgpt if smth similar exists, and it basically doesn't. There are many apps for tracking what you read (zotero, sematnic scholar, etc), and some apps that incorporate papers+social elemt (google scholar) but nothing really that allows for social reading of papers.

+ reading groups are extremely popular obv. So anyway I think there is great untapped potential here.

Gonna aim to buildv1 of mvp today and push it out. 

Another thought: rn there is also heavily missing a good engine for paper discovery. Twitter is kind of like that, nad citations, and semantic scholar and conferences and so on, but there def can be more.

Oct 25 17:54 came back to work on this. Trying to test this very simple version and make sure all the connections work (supabase, railway).

Rn hvaing some problems with supabase, once I figure them out and figure out railway i will be happy with my progress for the day.

Yay! connected to supabase and created the tables. it was jjust a fat finger error on my part, i forgot to click the reset password button.

okay great got basic search working! very exciting! Now gonna make sure it works with railway and then go eat.

Oct 27 update

okay i am back. Started working on google auth on Oct 25th but didn't finish, so just gonna knock it out quickly today. A lot of tasks to handle in other aspects of life rn too.

Still getting a lot of trouble with googla auth but want to finish it today.


