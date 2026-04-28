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
