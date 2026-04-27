-- Supports PATCH /api/users/me/profile onboarding persistence.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
