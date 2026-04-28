ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS time_spent_seconds integer;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS current_module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS current_content_id uuid REFERENCES public.course_contents(id) ON DELETE SET NULL;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.course_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.course_phase_questions(id) ON DELETE CASCADE,
  completed_answer_id uuid,
  selected_option_id uuid REFERENCES public.course_question_options(id) ON DELETE SET NULL,
  complex_answer jsonb,
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE CASCADE;

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.course_phase_questions(id) ON DELETE CASCADE;

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS completed_answer_id uuid;

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS selected_option_id uuid REFERENCES public.course_question_options(id) ON DELETE SET NULL;

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS complex_answer jsonb;

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS is_correct boolean NOT NULL DEFAULT false;

ALTER TABLE public.course_answers ADD COLUMN IF NOT EXISTS answered_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE,
  course_content_id uuid REFERENCES public.course_contents(id) ON DELETE CASCADE,
  title text,
  passing_score numeric,
  time_limit integer,
  shuffle_questions boolean NOT NULL DEFAULT false,
  points_reward integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS course_content_id uuid REFERENCES public.course_contents(id) ON DELETE CASCADE;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS passing_score numeric;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_limit integer;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT false;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS points_reward integer NOT NULL DEFAULT 0;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
