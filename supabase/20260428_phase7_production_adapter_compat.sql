-- StorePage production adapter compatibility.
-- Additive only: safe CREATE TABLE/ADD COLUMN/CREATE INDEX statements for the Supabase/PostgREST adapters.
-- Run after:
-- 1. 20260426_phase1_backend_adapter.sql
-- 2. 20260427_add_users_onboarding_completed.sql
-- 3. 20260427_phase5_surveys_adapter.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  link_name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS link_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_image text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_title text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_subtitle text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_cta_label text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS landing_page_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS landing_page_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS landing_page_layout text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS org_levels jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS org_unit_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS support_email text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS repositories_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lms_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS checklists_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS surveys_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS metrics_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS companies_slug_idx
  ON public.companies (slug)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'USER',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS normalized_email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_access boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_unit_id uuid;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_updated_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.users
   SET normalized_email = lower(email)
 WHERE normalized_email IS NULL
   AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_company_normalized_email_idx
  ON public.users (company_id, normalized_email)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.org_top_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  level_index integer NOT NULL DEFAULT 1,
  parent_id uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS level_index integer NOT NULL DEFAULT 1;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.org_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.provisioned_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  normalized_email text,
  cpf text,
  role text NOT NULL DEFAULT 'USER',
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'PENDING_SETUP',
  invited_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  activated_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS normalized_email text;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS token text;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING_SETUP';
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS invited_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.provisioned_invites
   SET normalized_email = lower(email)
 WHERE normalized_email IS NULL
   AND email IS NOT NULL;

UPDATE public.provisioned_invites
   SET token = encode(gen_random_bytes(24), 'hex')
 WHERE token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS provisioned_invites_token_uidx
  ON public.provisioned_invites (token)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  refresh_token_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  last_authenticated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  refresh_expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text
);

CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image text,
  banner_image text,
  featured boolean NOT NULL DEFAULT false,
  show_in_landing boolean NOT NULL DEFAULT false,
  type text NOT NULL DEFAULT 'CONTENT',
  status text NOT NULL DEFAULT 'ACTIVE',
  access_type text NOT NULL DEFAULT 'ALL',
  allowed_user_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_region_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_store_ids uuid[] NOT NULL DEFAULT '{}',
  excluded_user_ids uuid[] NOT NULL DEFAULT '{}',
  banner_position numeric,
  banner_brightness numeric,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS banner_image text;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS show_in_landing boolean NOT NULL DEFAULT false;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'CONTENT';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'ALL';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS allowed_user_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS allowed_region_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS allowed_store_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS excluded_user_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS banner_position numeric;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS banner_brightness numeric;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.repositories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS repositories_company_status_idx
  ON public.repositories (company_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS repository_id uuid REFERENCES public.repositories(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  repository_id uuid NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  type text NOT NULL,
  url text,
  embed_url text,
  featured boolean NOT NULL DEFAULT false,
  recent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ACTIVE',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS repository_id uuid REFERENCES public.repositories(id) ON DELETE CASCADE;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS embed_url text;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS recent boolean NOT NULL DEFAULT false;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.simple_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  repository_id uuid NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  type text,
  date timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS repository_id uuid REFERENCES public.repositories(id) ON DELETE CASCADE;
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS date timestamptz;
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.simple_links ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  repository_id uuid REFERENCES public.repositories(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE;
ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS repository_id uuid REFERENCES public.repositories(id) ON DELETE SET NULL;
ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL;
ALTER TABLE public.content_views ADD COLUMN IF NOT EXISTS viewed_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.content_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  repository_id uuid REFERENCES public.repositories(id) ON DELETE SET NULL,
  rating numeric NOT NULL,
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE;
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS repository_id uuid REFERENCES public.repositories(id) ON DELETE SET NULL;
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS rating numeric;
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL;
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
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
CREATE TABLE IF NOT EXISTS public.checklist_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_folders ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_folders ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.checklist_folders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.checklist_folders ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.checklist_folders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_image text,
  status text NOT NULL DEFAULT 'DRAFT',
  access_type text NOT NULL DEFAULT 'ALL',
  allowed_user_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_region_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_store_ids uuid[] NOT NULL DEFAULT '{}',
  folder_id uuid REFERENCES public.checklist_folders(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'DRAFT';
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'ALL';
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS allowed_user_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS allowed_region_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS allowed_store_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.checklist_folders(id) ON DELETE SET NULL;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.checklist_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_sections ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES public.checklists(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_sections ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.checklist_sections ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.checklist_sections ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.checklist_sections ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.checklist_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.checklist_sections(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'YES_NO',
  required boolean NOT NULL DEFAULT false,
  configuration jsonb,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.checklist_sections(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS question_text text;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'YES_NO';
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS required boolean NOT NULL DEFAULT false;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS configuration jsonb;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.checklist_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  score numeric,
  started_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES public.checklists(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'IN_PROGRESS';
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS score numeric;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.checklist_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.checklist_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.checklist_questions(id) ON DELETE CASCADE,
  value jsonb,
  text_value text,
  numeric_value numeric,
  boolean_value boolean,
  attachment_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  conformity text,
  notes text,
  answered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.checklist_submissions(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.checklist_questions(id) ON DELETE CASCADE;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS value jsonb;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS text_value text;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS numeric_value numeric;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS boolean_value boolean;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS attachment_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS conformity text;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS answered_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.checklist_submissions(id) ON DELETE SET NULL,
  answer_id uuid REFERENCES public.checklist_answers(id) ON DELETE SET NULL,
  checklist_id uuid REFERENCES public.checklists(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'OPEN',
  priority text NOT NULL DEFAULT 'MEDIUM',
  assignee_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.checklist_submissions(id) ON DELETE SET NULL;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS answer_id uuid REFERENCES public.checklist_answers(id) ON DELETE SET NULL;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES public.checklists(id) ON DELETE SET NULL;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'OPEN';
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS assignee_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS course_modules_course_order_idx
  ON public.course_modules (course_id, order_index)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS course_contents_module_order_idx
  ON public.course_contents (module_id, order_index)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS checklist_sections_checklist_order_idx
  ON public.checklist_sections (checklist_id, order_index)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS checklist_questions_section_order_idx
  ON public.checklist_questions (section_id, order_index)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS action_plans_company_status_idx
  ON public.action_plans (company_id, status)
  WHERE deleted_at IS NULL;
