ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS rating numeric;

ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL;

ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.content_ratings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
