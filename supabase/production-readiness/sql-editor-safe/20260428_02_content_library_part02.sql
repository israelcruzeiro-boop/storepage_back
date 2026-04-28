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
