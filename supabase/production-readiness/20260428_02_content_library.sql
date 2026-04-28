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
