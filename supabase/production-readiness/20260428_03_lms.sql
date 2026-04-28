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
