-- ===========================================
-- MARKD — Supabase Comprehensive Database Schema
-- "The Spotify for Movies"
-- ===========================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Prerequisite: Supabase Auth must be enabled.

-- 1. Media Items Table (Core Watchlist & History)
CREATE TABLE IF NOT EXISTS public.media_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),
  user_id          uuid        NOT NULL    REFERENCES auth.users (id) ON DELETE CASCADE,
  tmdb_id          int         NOT NULL,
  media_type       text        NOT NULL    CHECK (media_type IN ('movie', 'tv')),
  title            text        NOT NULL,
  poster_path      text,
  status           text        NOT NULL    DEFAULT 'plan_to_watch'
                               CHECK (status IN ('plan_to_watch', 'watching', 'completed', 'dropped')),
  rating           int                     CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  season_progress  int                     CHECK (season_progress IS NULL OR season_progress >= 0),
  episode_progress int                     CHECK (episode_progress IS NULL OR episode_progress >= 0)
);

ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_user_tmdb_unique;
ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_user_tmdb_unique
  UNIQUE (user_id, tmdb_id, media_type);

CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON public.media_items (user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON public.media_items (user_id, status);
CREATE INDEX IF NOT EXISTS idx_media_items_tmdb ON public.media_items (tmdb_id, media_type);

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media items"
  ON public.media_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own media items"
  ON public.media_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own media items"
  ON public.media_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media items"
  ON public.media_items FOR DELETE USING (auth.uid() = user_id);


-- 2. User Profiles Table (Cinema Identity & Settings)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id               uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  username         text        UNIQUE,
  display_name     text,
  avatar_url       text,
  bio              text,
  personality_archetype text,
  privacy_settings jsonb       NOT NULL DEFAULT '{"profile_public": true, "history_public": true, "ratings_public": true}'::jsonb
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles FOR SELECT
  USING (
    (privacy_settings->>'profile_public')::boolean = true OR auth.uid() = id
  );

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 3. Taste Profiles Table (Dynamic User Taste Vector)
CREATE TABLE IF NOT EXISTS public.taste_profiles (
  user_id          uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  favorite_genres  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  favorite_directors jsonb     NOT NULL DEFAULT '[]'::jsonb,
  favorite_actors  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  preferred_decades jsonb      NOT NULL DEFAULT '[]'::jsonb,
  dna_weights      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  pacing_affinity  text        DEFAULT 'balanced',
  emotional_scale  int         DEFAULT 5,
  darkness_scale   int         DEFAULT 5
);

ALTER TABLE public.taste_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own taste profile"
  ON public.taste_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own taste profile"
  ON public.taste_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 4. Taste Feedback Signals (Negative & Contextual Signals)
CREATE TABLE IF NOT EXISTS public.taste_feedback (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tmdb_id          int         NOT NULL,
  media_type       text        NOT NULL CHECK (media_type IN ('movie', 'tv')),
  signal_type      text        NOT NULL CHECK (signal_type IN ('not_interested', 'already_watched', 'not_my_type', 'less_like_this')),
  UNIQUE (user_id, tmdb_id, media_type, signal_type)
);

CREATE INDEX IF NOT EXISTS idx_taste_feedback_user ON public.taste_feedback (user_id);
ALTER TABLE public.taste_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own taste feedback"
  ON public.taste_feedback FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 5. Cinema Journeys Progress
CREATE TABLE IF NOT EXISTS public.user_journeys (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  journey_id       text        NOT NULL,
  completed_tmdb_ids jsonb     NOT NULL DEFAULT '[]'::jsonb,
  progress_pct     int         NOT NULL DEFAULT 0,
  is_completed     boolean     NOT NULL DEFAULT false,
  completed_at     timestamptz,
  UNIQUE (user_id, journey_id)
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user ON public.user_journeys (user_id);
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journeys"
  ON public.user_journeys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 6. Cinema Challenges Progress
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  challenge_id     text        NOT NULL,
  current_count    int         NOT NULL DEFAULT 0,
  target_count     int         NOT NULL DEFAULT 10,
  is_completed     boolean     NOT NULL DEFAULT false,
  completed_at     timestamptz,
  UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges (user_id);
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own challenges"
  ON public.user_challenges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 7. Custom Lists & Items
CREATE TABLE IF NOT EXISTS public.custom_lists (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text,
  is_public        boolean     NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.custom_list_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  added_at         timestamptz NOT NULL DEFAULT now(),
  list_id          uuid        NOT NULL REFERENCES public.custom_lists (id) ON DELETE CASCADE,
  tmdb_id          int         NOT NULL,
  media_type       text        NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title            text        NOT NULL,
  poster_path      text,
  notes            text,
  UNIQUE (list_id, tmdb_id, media_type)
);

ALTER TABLE public.custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lists are viewable by owner or if public"
  ON public.custom_lists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own lists"
  ON public.custom_lists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "List items are viewable if parent list is viewable"
  ON public.custom_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_lists l
      WHERE l.id = list_id AND (l.is_public = true OR l.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can modify items of their own lists"
  ON public.custom_list_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.custom_lists l WHERE l.id = list_id AND l.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.custom_lists l WHERE l.id = list_id AND l.user_id = auth.uid())
  );


-- 8. User Reviews & Notes
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  user_id          uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tmdb_id          int         NOT NULL,
  media_type       text        NOT NULL CHECK (media_type IN ('movie', 'tv')),
  rating           int         CHECK (rating >= 1 AND rating <= 10),
  review_text      text        NOT NULL,
  contains_spoilers boolean    NOT NULL DEFAULT false,
  likes_count      int         NOT NULL DEFAULT 0,
  UNIQUE (user_id, tmdb_id, media_type)
);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reviews are viewable by all"
  ON public.user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews"
  ON public.user_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 9. Account Deletion RPC
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

