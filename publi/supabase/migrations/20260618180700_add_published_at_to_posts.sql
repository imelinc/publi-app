-- Migration: add_published_at_to_posts
-- Created at: 2026-06-18
ALTER TABLE posts ADD COLUMN published_at timestamp with time zone;
