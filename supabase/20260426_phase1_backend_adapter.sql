-- StorePage Backend Fase 1 adapter support.
-- Run this in the Supabase SQL editor before using REPOSITORY_DRIVER=supabase.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS hero_cta_label text,
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS repositories_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS lms_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS surveys_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metrics_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS normalized_email text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.users
   SET normalized_email = lower(email)
 WHERE normalized_email IS NULL;

CREATE INDEX IF NOT EXISTS users_company_normalized_email_idx
  ON public.users (company_id, normalized_email)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS users_company_cpf_idx
  ON public.users (company_id, cpf)
  WHERE deleted_at IS NULL AND cpf IS NOT NULL;

ALTER TABLE public.provisioned_invites
  ADD COLUMN IF NOT EXISTS normalized_email text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS token text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING_SETUP',
  ADD COLUMN IF NOT EXISTS invited_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.provisioned_invites
   SET normalized_email = lower(email)
 WHERE normalized_email IS NULL;

UPDATE public.provisioned_invites
   SET token = encode(gen_random_bytes(24), 'hex')
 WHERE token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS provisioned_invites_token_uidx
  ON public.provisioned_invites (token)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS provisioned_invites_company_status_idx
  ON public.provisioned_invites (company_id, status)
  WHERE deleted_at IS NULL;

ALTER TABLE public.org_top_levels
  ADD COLUMN IF NOT EXISTS level_index integer,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.org_top_levels
   SET level_index = COALESCE(NULLIF(level_id, '')::integer, 1)
 WHERE level_index IS NULL
   AND level_id ~ '^[0-9]+$';

UPDATE public.org_top_levels
   SET level_index = 1
 WHERE level_index IS NULL;

ALTER TABLE public.org_top_levels
  ALTER COLUMN level_index SET NOT NULL;

ALTER TABLE public.org_units
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.org_units
   SET top_level_id = parent_id
 WHERE top_level_id IS NULL
   AND parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  refresh_token_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  last_authenticated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  refresh_expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text
);

CREATE INDEX IF NOT EXISTS auth_sessions_company_user_active_idx
  ON public.auth_sessions (company_id, user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages backend sessions" ON public.auth_sessions;
CREATE POLICY "Service role manages backend sessions"
  ON public.auth_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
