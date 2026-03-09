-- Migration 010: Add onboarding profile fields to user_profiles

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS age          INTEGER CHECK (age > 0 AND age < 120),
  ADD COLUMN IF NOT EXISTS gender       TEXT CHECK (gender IN ('male', 'female', 'nonbinary', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS height_cm    DECIMAL(5,1) CHECK (height_cm > 50 AND height_cm < 300),
  ADD COLUMN IF NOT EXISTS weight_kg    DECIMAL(6,2) CHECK (weight_kg > 10 AND weight_kg < 500);
