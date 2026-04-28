ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text,
  url text,
  content_url text,
  file_path text,
  size_bytes bigint,
  html_content text,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS type text;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS url text;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS content_url text;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS file_path text;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS size_bytes bigint;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS html_content text;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.course_contents ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_phase_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text,
  configuration jsonb,
  image_url text,
  explanation text,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS question_text text;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS question_type text;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS configuration jsonb;
