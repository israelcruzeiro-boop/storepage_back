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
