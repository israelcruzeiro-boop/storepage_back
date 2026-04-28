CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  explanation text,
  source_excerpt text,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz
);

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_text text;

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS explanation text;

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS source_excerpt text;

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz
);

ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS option_text text;

ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS is_correct boolean NOT NULL DEFAULT false;

ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.quiz_options ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS score numeric NOT NULL DEFAULT 0;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS passed boolean NOT NULL DEFAULT false;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS completed_at timestamptz NOT NULL DEFAULT now();
