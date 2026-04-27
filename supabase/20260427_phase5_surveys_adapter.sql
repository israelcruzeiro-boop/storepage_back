-- StorePage Backend Phase 5 surveys adapter support.
-- Run after 20260426_phase1_backend_adapter.sql and 20260427_add_users_onboarding_completed.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'DRAFT',
  access_type text NOT NULL DEFAULT 'ALL',
  allowed_user_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_region_ids uuid[] NOT NULL DEFAULT '{}',
  allowed_store_ids uuid[] NOT NULL DEFAULT '{}',
  excluded_user_ids uuid[] NOT NULL DEFAULT '{}',
  allow_multiple_responses boolean NOT NULL DEFAULT false,
  anonymous boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  cover_image text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS allowed_user_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_region_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_store_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_user_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allow_multiple_responses boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  description text,
  question_type text NOT NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  required boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_questions
  ADD COLUMN IF NOT EXISTS survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS question_text text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS question_type text,
  ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  org_top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS org_top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.survey_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_answers
  ADD COLUMN IF NOT EXISTS response_id uuid REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS question_id uuid REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS value jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS surveys_company_status_idx
  ON public.surveys (company_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS survey_questions_survey_order_idx
  ON public.survey_questions (survey_id, order_index)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS survey_responses_company_survey_idx
  ON public.survey_responses (company_id, survey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS survey_responses_company_user_idx
  ON public.survey_responses (company_id, user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS survey_answers_response_idx
  ON public.survey_answers (response_id);
