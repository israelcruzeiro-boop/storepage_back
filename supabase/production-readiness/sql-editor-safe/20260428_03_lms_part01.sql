-- StorePage production compatibility: LMS courses, enrollments and quizzes.
-- Validated against PostgreSQL 16 with ON_ERROR_STOP=1.

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  cover_image text,
  image_url text,
  status text NOT NULL DEFAULT 'DRAFT',
  access_type text NOT NULL DEFAULT 'ALL',
  allowed_user_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_region_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_store_ids uuid[] NOT NULL DEFAULT '{}',
  excluded_user_ids uuid[] NOT NULL DEFAULT '{}',
  target_audience text[] NOT NULL DEFAULT '{}',
  passing_score numeric NOT NULL DEFAULT 70,
  diploma_template jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS cover_image text;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'DRAFT';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'ALL';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS allowed_user_ids uuid[] NOT NULL DEFAULT '{}';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS allowed_region_ids uuid[] NOT NULL DEFAULT '{}';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS allowed_store_ids uuid[] NOT NULL DEFAULT '{}';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS excluded_user_ids uuid[] NOT NULL DEFAULT '{}';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS target_audience text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS passing_score numeric NOT NULL DEFAULT 70;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS diploma_template jsonb;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
