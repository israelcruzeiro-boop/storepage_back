-- StorePage production compatibility: checklists, submissions, answers and action plans.
-- Validated against PostgreSQL 16 with ON_ERROR_STOP=1.

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
