--
-- PostgreSQL database dump
--

\restrict TPli9ihNAmWSxadpM9wxrTuBKOmjgNdtfFe2DiW7cSqbPE7QaRtLqK7k7bCKIwu

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: fn_follows_after_insert_followed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_follows_after_insert_followed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  insert into public.posts (user_id, type, target_user_id)
  values (new.follower_id, 'followed', new.following_id);
  return new;
end;
$$;


--
-- Name: fn_profile_after_insert_user_joined(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_profile_after_insert_user_joined() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Insert an activity row for the newly created profile owner.
  insert into public.posts (user_id, type)
  values (new.id, 'user_joined');
  return new;
end;
$$;


--
-- Name: fn_user_papers_after_insert_added(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_user_papers_after_insert_added() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  insert into public.posts (user_id, type, openalex_id, status)
  values (new.user_id, 'added_to_shelf', new.openalex_id, new.status);
  return new;
end;
$$;


--
-- Name: fn_user_papers_after_update_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_user_papers_after_update_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if (old.status is distinct from new.status) then
    insert into public.posts (user_id, type, openalex_id, status)
    values (new.user_id, 'status_changed', new.openalex_id, new.status);
  end if;
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT follows_no_self CHECK ((follower_id <> following_id))
);


--
-- Name: papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.papers (
    openalex_id text NOT NULL,
    title text NOT NULL,
    authors_json jsonb,
    year integer,
    url text,
    source text,
    inserted_at timestamp with time zone DEFAULT now()
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    openalex_id text,
    status text,
    rating integer,
    note text,
    created_at timestamp with time zone DEFAULT now(),
    target_user_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text,
    display_name text,
    bio text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_papers (
    user_id uuid NOT NULL,
    openalex_id text NOT NULL,
    status text DEFAULT 'to_read'::text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_papers_status_valid CHECK ((status = ANY (ARRAY['to_read'::text, 'reading'::text, 'read'::text])))
);


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.follows (follower_id, following_id, created_at) FROM stdin;
50927532-e805-427c-b055-dbd57b3807ad	0045d4f3-1296-4024-92e6-404ba23c9ca0	2025-11-11 19:13:08.757099+00
50927532-e805-427c-b055-dbd57b3807ad	2f593132-69e8-4dc7-8de0-8138d91690ff	2025-11-11 19:13:08.898421+00
0045d4f3-1296-4024-92e6-404ba23c9ca0	50927532-e805-427c-b055-dbd57b3807ad	2025-11-11 19:13:09.005955+00
2f593132-69e8-4dc7-8de0-8138d91690ff	beb27420-f3f4-46b1-9113-ffdba55d7261	2025-11-11 19:13:09.166077+00
2f593132-69e8-4dc7-8de0-8138d91690ff	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	2025-11-11 19:13:09.28046+00
ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	0045d4f3-1296-4024-92e6-404ba23c9ca0	2025-11-12 03:16:58.430789+00
ff37f656-c57b-45cc-ab16-f68ca2a44a40	ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	2025-11-12 03:31:15.93506+00
\.


--
-- Data for Name: papers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.papers (openalex_id, title, authors_json, year, url, source, inserted_at) FROM stdin;
W2626778328	Attention Is All You Need	["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"]	2022	http://arxiv.org/abs/1706.03762	arXiv (Cornell University)	2025-11-06 17:07:52.186153+00
W4400101937	Review of: "Current Trends in the Use of Machine Learning for Error Correction in Ukrainian Texts"	["Juan J. Casal"]	2024	https://doi.org/10.32388/ra4eh4	openalex	2025-11-08 19:52:16.718418+00
W2741809807	Attention Is All You Need	["Ashish Vaswani", "Noam Shazeer"]	2017	https://arxiv.org/abs/1706.03762	arXiv	2025-11-11 19:13:09.408562+00
W1999700147	ImageNet Classification with Deep Convolutional Neural Networks	["Alex Krizhevsky", "Ilya Sutskever"]	2012	https://dl.acm.org/doi/10.1145/3065386	ACM	2025-11-11 19:13:09.408562+00
W3044976299	BERT: Pre-training of Deep Bidirectional Transformers	["Jacob Devlin"]	2018	https://arxiv.org/abs/1810.04805	arXiv	2025-11-11 19:13:09.408562+00
W4281986121	GPT-3: Language Models are Few-Shot Learners	["Tom B. Brown"]	2020	https://arxiv.org/abs/2005.14165	arXiv	2025-11-11 19:13:09.408562+00
W2149351940	ResNet: Deep Residual Learning for Image Recognition	["Kaiming He"]	2015	https://arxiv.org/abs/1512.03385	arXiv	2025-11-11 19:13:09.408562+00
W2274287116	Inception-v4, Inception-ResNet and the Impact of Residual Connections on Learning	["Christian Szegedy", "Sergey Ioffe", "Vincent Vanhoucke", "Alexander A. Alemi"]	2017	https://doi.org/10.1609/aaai.v31i1.11231	Proceedings of the AAAI Conference on Artificial Intelligence	2025-11-11 19:23:06.80947+00
W2333796428	Resnet in Resnet: Generalizing Residual Architectures	["Sasha Targ", "Diogo Almeida", "Kevin Lyman"]	2022	http://arxiv.org/abs/1603.08029	arXiv (Cornell University)	2025-11-12 02:24:02.142821+00
W2558580397	Wider or Deeper: Revisiting the ResNet Model for Visual Recognition	["Zifeng Wu", "Chunhua Shen", "Anton van den Hengel"]	2019	https://doi.org/10.1016/j.patcog.2019.01.006	Pattern Recognition	2025-11-12 02:24:20.983768+00
W1982836372	Diagnosis and Improvement of Saline and Alkali Soils	["L. A. Richards"]	1954	https://doi.org/10.1097/00010694-195408000-00012	Soil Science	2025-11-12 03:15:55.980507+00
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_likes (post_id, user_id, created_at) FROM stdin;
948239c9-ab1b-423d-abc4-446f66943298	ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	2025-11-12 04:40:42.082814+00
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (id, user_id, type, openalex_id, status, rating, note, created_at, target_user_id) FROM stdin;
dd5300ec-a32b-4038-a29a-4aca56e47f00	50927532-e805-427c-b055-dbd57b3807ad	added_to_library	W2149351940	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
b67c7003-f294-429b-b442-2b61e77719aa	50927532-e805-427c-b055-dbd57b3807ad	status_changed	W2149351940	to_read	\N	\N	2025-11-11 19:13:11.361784+00	\N
79b51e02-bab7-4008-b5d1-72df460f8c44	50927532-e805-427c-b055-dbd57b3807ad	added_to_library	W4281986121	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
2a7a56c4-0ce5-4f94-a73b-a9b0131a215d	50927532-e805-427c-b055-dbd57b3807ad	status_changed	W4281986121	reading	\N	\N	2025-11-11 19:13:11.361784+00	\N
e4063060-6145-4caa-8461-eb1919ec79cf	50927532-e805-427c-b055-dbd57b3807ad	added_to_library	W1999700147	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
ae17fdf0-a44a-46f4-a13d-9f0839105aa3	50927532-e805-427c-b055-dbd57b3807ad	status_changed	W1999700147	read	\N	\N	2025-11-11 19:13:11.361784+00	\N
6083cb01-5f73-492e-8c5e-b51ba1ac04ce	0045d4f3-1296-4024-92e6-404ba23c9ca0	added_to_library	W3044976299	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
c9133608-0196-462e-b3f7-7e204bb32c4c	0045d4f3-1296-4024-92e6-404ba23c9ca0	status_changed	W3044976299	to_read	\N	\N	2025-11-11 19:13:11.361784+00	\N
73578881-77f2-488f-b3fb-2b105f9763d4	0045d4f3-1296-4024-92e6-404ba23c9ca0	added_to_library	W2741809807	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
5e46e7cf-ea70-48a2-b808-b82a8f195693	0045d4f3-1296-4024-92e6-404ba23c9ca0	status_changed	W2741809807	reading	\N	\N	2025-11-11 19:13:11.361784+00	\N
46925ee0-94ca-4b19-b531-a285f0ecbefa	0045d4f3-1296-4024-92e6-404ba23c9ca0	added_to_library	W4281986121	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
1fe0cff8-28a8-4fb4-a92b-ed0843d2eb49	0045d4f3-1296-4024-92e6-404ba23c9ca0	status_changed	W4281986121	read	\N	\N	2025-11-11 19:13:11.361784+00	\N
ee392fd1-7b2e-4380-8b74-2e24e41df072	2f593132-69e8-4dc7-8de0-8138d91690ff	added_to_library	W2741809807	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
b6b5d173-113d-4e2f-bea7-6417a5a37ee9	2f593132-69e8-4dc7-8de0-8138d91690ff	status_changed	W2741809807	to_read	\N	\N	2025-11-11 19:13:11.361784+00	\N
f8edcd7b-0fac-49c3-bb11-d4a745220b4a	2f593132-69e8-4dc7-8de0-8138d91690ff	added_to_library	W4281986121	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
8f6130c4-247f-4893-9818-0075409ccc5c	2f593132-69e8-4dc7-8de0-8138d91690ff	status_changed	W4281986121	reading	\N	\N	2025-11-11 19:13:11.361784+00	\N
c9fe0b9c-6cb1-4eea-8d1e-eaec4a2b60f3	2f593132-69e8-4dc7-8de0-8138d91690ff	added_to_library	W1999700147	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
b6ae8a2c-2a02-4ed0-b8e6-5a362e46b6ae	2f593132-69e8-4dc7-8de0-8138d91690ff	status_changed	W1999700147	read	\N	\N	2025-11-11 19:13:11.361784+00	\N
3f8c3b17-00a0-4bf1-8ce5-e62aedacc3ac	beb27420-f3f4-46b1-9113-ffdba55d7261	added_to_library	W2149351940	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
2dee583f-e402-4fae-baad-37feffd71fa4	beb27420-f3f4-46b1-9113-ffdba55d7261	status_changed	W2149351940	to_read	\N	\N	2025-11-11 19:13:11.361784+00	\N
bbf40586-dc58-4830-8878-e955995dff17	beb27420-f3f4-46b1-9113-ffdba55d7261	added_to_library	W1999700147	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
3ac1a18f-4213-4e51-83c2-5eae92862b59	beb27420-f3f4-46b1-9113-ffdba55d7261	status_changed	W1999700147	reading	\N	\N	2025-11-11 19:13:11.361784+00	\N
eca100ee-19af-4139-888d-3058ee161d26	beb27420-f3f4-46b1-9113-ffdba55d7261	added_to_library	W4281986121	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
4f044e21-38dd-45da-aa3f-7dd5ef3f3222	beb27420-f3f4-46b1-9113-ffdba55d7261	status_changed	W4281986121	read	\N	\N	2025-11-11 19:13:11.361784+00	\N
8b59d58d-94c7-404f-9415-3453246b7f17	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	added_to_library	W4281986121	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
1f1c4eca-4d8b-4b12-a17f-60c1152f906e	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	status_changed	W4281986121	to_read	\N	\N	2025-11-11 19:13:11.361784+00	\N
79fe0ceb-f10b-4045-a1ad-811186479b28	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	added_to_library	W3044976299	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
bcd3bdaa-109c-4c13-a810-973e602cf3f5	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	status_changed	W3044976299	reading	\N	\N	2025-11-11 19:13:11.361784+00	\N
473f8232-ad93-4359-8e3a-e357aaccda88	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	added_to_library	W1999700147	\N	\N	\N	2025-11-11 19:13:11.361784+00	\N
5b8872e7-e3a9-4f69-8cfa-6aff305b20d8	8c32a5fe-d6f8-4892-81fc-7b1ff945515d	status_changed	W1999700147	read	\N	\N	2025-11-11 19:13:11.361784+00	\N
d299a907-fd73-4ac0-9eb7-639d882c29f0	ff37f656-c57b-45cc-ab16-f68ca2a44a40	added_to_shelf	W2274287116	to_read	\N	\N	2025-11-12 02:23:56.257519+00	\N
c74a52a7-83d4-4c23-9529-cf6bf88b9600	ff37f656-c57b-45cc-ab16-f68ca2a44a40	added_to_shelf	W2333796428	to_read	\N	\N	2025-11-12 02:24:02.260347+00	\N
874a3290-2047-49f4-a769-3456edc1a49d	ff37f656-c57b-45cc-ab16-f68ca2a44a40	added_to_shelf	W2558580397	read	\N	\N	2025-11-12 02:24:21.044793+00	\N
6950712f-3317-496f-8fc5-1d91154e0cb8	ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	user_joined	\N	\N	\N	\N	2025-11-12 03:14:24.163285+00	\N
948239c9-ab1b-423d-abc4-446f66943298	ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	added_to_shelf	W1982836372	read	\N	\N	2025-11-12 03:15:56.122233+00	\N
c2db85a8-a7b2-4827-b658-707f2d898bc9	ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	followed	\N	\N	\N	\N	2025-11-12 03:16:58.430789+00	0045d4f3-1296-4024-92e6-404ba23c9ca0
648dc633-8d86-48cc-b32a-979a8644487d	ff37f656-c57b-45cc-ab16-f68ca2a44a40	followed	\N	\N	\N	\N	2025-11-12 03:31:15.93506+00	ee33e553-f0f7-4eec-86d6-ed7e47f8dda8
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, username, display_name, bio, avatar_url, created_at, updated_at) FROM stdin;
50927532-e805-427c-b055-dbd57b3807ad	alice	Alice	Hello, I'm alice.	\N	2025-11-11 19:13:08.485875+00	2025-11-11 19:13:08.485875+00
0045d4f3-1296-4024-92e6-404ba23c9ca0	bob	Bob	Hello, I'm bob.	\N	2025-11-11 19:13:08.485875+00	2025-11-11 19:13:08.485875+00
2f593132-69e8-4dc7-8de0-8138d91690ff	charlie	Charlie	Hello, I'm charlie.	\N	2025-11-11 19:13:08.485875+00	2025-11-11 19:13:08.485875+00
beb27420-f3f4-46b1-9113-ffdba55d7261	david	David	Hello, I'm david.	\N	2025-11-11 19:13:08.485875+00	2025-11-11 19:13:08.485875+00
8c32a5fe-d6f8-4892-81fc-7b1ff945515d	elaine	Elaine	Hello, I'm elaine.	\N	2025-11-11 19:13:08.485875+00	2025-11-11 19:13:08.485875+00
ff37f656-c57b-45cc-ab16-f68ca2a44a40	lenguist	Maksym Bondarenko	i love reading papers	\N	2025-11-08 19:50:53.977392+00	2025-11-08 19:50:53.977392+00
ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	veronika	Veronika Kitsul	\N	\N	2025-11-12 03:14:24.163285+00	2025-11-12 03:14:24.163285+00
\.


--
-- Data for Name: user_papers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_papers (user_id, openalex_id, status, inserted_at) FROM stdin;
50927532-e805-427c-b055-dbd57b3807ad	W2149351940	to_read	2025-11-11 19:13:09.536229+00
50927532-e805-427c-b055-dbd57b3807ad	W4281986121	reading	2025-11-11 19:13:09.660224+00
50927532-e805-427c-b055-dbd57b3807ad	W1999700147	read	2025-11-11 19:13:09.771606+00
0045d4f3-1296-4024-92e6-404ba23c9ca0	W3044976299	to_read	2025-11-11 19:13:09.885452+00
0045d4f3-1296-4024-92e6-404ba23c9ca0	W2741809807	reading	2025-11-11 19:13:09.999156+00
0045d4f3-1296-4024-92e6-404ba23c9ca0	W4281986121	read	2025-11-11 19:13:10.114805+00
2f593132-69e8-4dc7-8de0-8138d91690ff	W2741809807	to_read	2025-11-11 19:13:10.23752+00
2f593132-69e8-4dc7-8de0-8138d91690ff	W4281986121	reading	2025-11-11 19:13:10.357291+00
2f593132-69e8-4dc7-8de0-8138d91690ff	W1999700147	read	2025-11-11 19:13:10.464461+00
beb27420-f3f4-46b1-9113-ffdba55d7261	W2149351940	to_read	2025-11-11 19:13:10.703637+00
beb27420-f3f4-46b1-9113-ffdba55d7261	W1999700147	reading	2025-11-11 19:13:10.797751+00
beb27420-f3f4-46b1-9113-ffdba55d7261	W4281986121	read	2025-11-11 19:13:10.916343+00
8c32a5fe-d6f8-4892-81fc-7b1ff945515d	W4281986121	to_read	2025-11-11 19:13:11.01545+00
8c32a5fe-d6f8-4892-81fc-7b1ff945515d	W3044976299	reading	2025-11-11 19:13:11.137408+00
8c32a5fe-d6f8-4892-81fc-7b1ff945515d	W1999700147	read	2025-11-11 19:13:11.223633+00
ff37f656-c57b-45cc-ab16-f68ca2a44a40	W2274287116	to_read	2025-11-12 02:23:56.257519+00
ff37f656-c57b-45cc-ab16-f68ca2a44a40	W2333796428	to_read	2025-11-12 02:24:02.260347+00
ff37f656-c57b-45cc-ab16-f68ca2a44a40	W2558580397	read	2025-11-12 02:24:21.044793+00
ee33e553-f0f7-4eec-86d6-ed7e47f8dda8	W1982836372	read	2025-11-12 03:15:56.122233+00
\.


--
-- Name: follows follows_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_unique UNIQUE (follower_id, following_id);


--
-- Name: papers papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.papers
    ADD CONSTRAINT papers_pkey PRIMARY KEY (openalex_id);


--
-- Name: post_likes post_likes_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_unique UNIQUE (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: user_papers user_papers_user_id_openalex_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papers
    ADD CONSTRAINT user_papers_user_id_openalex_id_key UNIQUE (user_id, openalex_id);


--
-- Name: idx_follows_follower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);


--
-- Name: idx_post_likes_post; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_likes_post ON public.post_likes USING btree (post_id);


--
-- Name: idx_post_likes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_likes_user ON public.post_likes USING btree (user_id);


--
-- Name: idx_posts_openalex; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_openalex ON public.posts USING btree (openalex_id);


--
-- Name: idx_posts_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user_created ON public.posts USING btree (user_id, created_at DESC);


--
-- Name: idx_user_papers_user_inserted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_papers_user_inserted ON public.user_papers USING btree (user_id, inserted_at DESC);


--
-- Name: profiles_username_ci_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_username_ci_unique ON public.profiles USING btree (lower(username));


--
-- Name: follows trg_follows_after_insert_followed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_follows_after_insert_followed AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.fn_follows_after_insert_followed();


--
-- Name: profiles trg_profile_after_insert_user_joined; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profile_after_insert_user_joined AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_profile_after_insert_user_joined();


--
-- Name: user_papers trg_user_papers_after_insert_added; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_papers_after_insert_added AFTER INSERT ON public.user_papers FOR EACH ROW EXECUTE FUNCTION public.fn_user_papers_after_insert_added();


--
-- Name: user_papers trg_user_papers_after_update_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_papers_after_update_status AFTER UPDATE OF status ON public.user_papers FOR EACH ROW EXECUTE FUNCTION public.fn_user_papers_after_update_status();


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_papers user_papers_openalex_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papers
    ADD CONSTRAINT user_papers_openalex_id_fkey FOREIGN KEY (openalex_id) REFERENCES public.papers(openalex_id) ON DELETE CASCADE;


--
-- Name: user_papers user_papers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_papers
    ADD CONSTRAINT user_papers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

--
-- Name: follows follows are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "follows are publicly readable" ON public.follows FOR SELECT USING (true);


--
-- Name: papers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

--
-- Name: papers papers insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "papers insert for authenticated" ON public.papers FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: papers papers select for all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "papers select for all" ON public.papers FOR SELECT TO authenticated, anon USING (true);


--
-- Name: papers papers update for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "papers update for authenticated" ON public.papers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes post_likes are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "post_likes are publicly readable" ON public.post_likes FOR SELECT USING (true);


--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: posts posts are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "posts are publicly readable" ON public.posts FOR SELECT USING (true);


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "profiles are publicly readable" ON public.profiles FOR SELECT USING (true);


--
-- Name: posts user can create their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can create their own posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: posts user can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can delete their own posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: follows user can follow others; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can follow others" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: post_likes user can like posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can like posts" ON public.post_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: posts user can manage their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can manage their own posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_likes user can remove their like; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can remove their like" ON public.post_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: follows user can unfollow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can unfollow" ON public.follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: user_papers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_papers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_papers user_papers delete own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user_papers delete own" ON public.user_papers FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_papers user_papers insert own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user_papers insert own" ON public.user_papers FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_papers user_papers select own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user_papers select own" ON public.user_papers FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: profiles users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- PostgreSQL database dump complete
--

\unrestrict TPli9ihNAmWSxadpM9wxrTuBKOmjgNdtfFe2DiW7cSqbPE7QaRtLqK7k7bCKIwu

