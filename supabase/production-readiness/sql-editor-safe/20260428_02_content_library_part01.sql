-- StorePage production compatibility: repositories, contents, links and metrics.
-- Validated against PostgreSQL 16 with ON_ERROR_STOP=1.

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
