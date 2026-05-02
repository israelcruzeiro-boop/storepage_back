-- Add course layout template metadata for backend/API contracts.
-- Additive only: keeps RLS, auth, permissions, enrollment and progress flows untouched.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS layout_template text;

UPDATE public.courses
SET layout_template = 'focus'
WHERE layout_template IS NULL
  OR layout_template NOT IN ('focus', 'studio', 'journey');

ALTER TABLE public.courses
  ALTER COLUMN layout_template SET DEFAULT 'focus',
  ALTER COLUMN layout_template SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'courses'
      AND constraint_name = 'courses_layout_template_check'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_layout_template_check
      CHECK (layout_template IN ('focus', 'studio', 'journey'));
  END IF;
END $$;
