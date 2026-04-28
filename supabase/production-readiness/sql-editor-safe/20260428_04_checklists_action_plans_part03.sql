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
