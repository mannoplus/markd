-- ===========================================
-- MARKD — Supabase Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Prerequisite: Supabase Auth must be enabled (it is by default).

-- 1. Create the media_items table
CREATE TABLE IF NOT EXISTS public.media_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  user_id       uuid        NOT NULL    REFERENCES auth.users (id) ON DELETE CASCADE,
  tmdb_id       int         NOT NULL,
  media_type    text        NOT NULL    CHECK (media_type IN ('movie', 'tv')),
  title         text        NOT NULL,
  poster_path   text,
  status        text        NOT NULL    DEFAULT 'plan_to_watch'
                            CHECK (status IN ('plan_to_watch', 'watching', 'completed', 'dropped')),
  rating        int                     CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  season_progress  int                  CHECK (season_progress IS NULL OR season_progress >= 0),
  episode_progress int                  CHECK (episode_progress IS NULL OR episode_progress >= 0)
);

-- 2. Unique constraint — a user can only track a specific title once
ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_user_tmdb_unique
  UNIQUE (user_id, tmdb_id, media_type);

-- 3. Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_media_items_user_id
  ON public.media_items (user_id);

CREATE INDEX IF NOT EXISTS idx_media_items_status
  ON public.media_items (user_id, status);

-- 4. Enable Row Level Security
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — users can only manage their own rows
CREATE POLICY "Users can view their own media items"
  ON public.media_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media items"
  ON public.media_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media items"
  ON public.media_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media items"
  ON public.media_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RPC Function for users to delete their own account
-- Since Supabase v2, `auth.admin.deleteUser()` requires the service role key.
-- Alternatively, we can let users manage their own deletion via this function:
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER -- Runs with the privileges of the creator (postgres)
SET search_path = public
AS $$
  -- Delete from auth.users. 
  -- Note: Depending on your foreign key constraints, this will cascade and delete associated media_items.
  DELETE FROM auth.users WHERE id = auth.uid();
$$;
