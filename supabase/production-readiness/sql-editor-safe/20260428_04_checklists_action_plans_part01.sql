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
