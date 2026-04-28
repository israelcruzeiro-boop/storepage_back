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
