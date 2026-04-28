ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS score numeric;

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS started_at timestamptz;

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS text_value text;

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS numeric_value numeric;

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS boolean_value boolean;

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS attachment_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS conformity text;

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.checklist_answers ADD COLUMN IF NOT EXISTS answered_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.checklist_submissions(id) ON DELETE SET NULL;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS answer_id uuid REFERENCES public.checklist_answers(id) ON DELETE SET NULL;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES public.checklists(id) ON DELETE SET NULL;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'OPEN';

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS assignee_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.action_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS auth_sessions_company_user_active_idx
  ON public.auth_sessions (company_id, user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS action_plans_company_status_idx
  ON public.action_plans (company_id, status)
  WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
