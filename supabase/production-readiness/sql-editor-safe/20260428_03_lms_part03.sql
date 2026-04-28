ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS explanation text;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.course_phase_questions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.course_phase_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.course_phase_questions(id) ON DELETE CASCADE;

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS option_text text;

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS is_correct boolean NOT NULL DEFAULT false;

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.course_question_options ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  started_at timestamptz,
  completed_at timestamptz,
  score_percent numeric,
  total_correct integer,
  total_questions integer,
  time_spent_seconds integer,
  current_module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  current_content_id uuid REFERENCES public.course_contents(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'IN_PROGRESS';

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS score_percent numeric;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS total_correct integer;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS total_questions integer;
