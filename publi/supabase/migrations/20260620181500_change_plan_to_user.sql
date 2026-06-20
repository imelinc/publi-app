-- Migration: change_plan_to_user
-- Created at: 2026-06-20

-- Add plan column to profiles table
ALTER TABLE profiles ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro'));

-- Set all existing users to pro as requested
UPDATE profiles SET plan = 'pro';

-- Remove plan column from clients table
ALTER TABLE clients DROP COLUMN plan;
