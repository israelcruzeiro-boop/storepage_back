-- StorePage production compatibility: core identity, tenants, org structure and sessions.
-- Validated against PostgreSQL 16 with ON_ERROR_STOP=1.

-- StorePage production adapter compatibility.
-- Additive only: safe CREATE TABLE/ADD COLUMN/CREATE INDEX statements for the Supabase/PostgREST adapters.
-- Run after:
-- 1. 20260426_phase1_backend_adapter.sql
-- 2. 20260427_add_users_onboarding_completed.sql
-- 3. 20260427_phase5_surveys_adapter.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  link_name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS link_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_image text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_title text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_subtitle text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hero_cta_label text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS landing_page_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS landing_page_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS landing_page_layout text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS org_levels jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS org_unit_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS support_email text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS repositories_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lms_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS checklists_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS surveys_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS metrics_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS companies_slug_idx
  ON public.companies (slug)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'USER',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS normalized_email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_access boolean NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_unit_id uuid;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_updated_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.users
   SET normalized_email = lower(email)
 WHERE normalized_email IS NULL
   AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_company_normalized_email_idx
  ON public.users (company_id, normalized_email)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.org_top_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  level_index integer NOT NULL DEFAULT 1,
  parent_id uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS level_index integer NOT NULL DEFAULT 1;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.org_top_levels ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.org_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS top_level_id uuid REFERENCES public.org_top_levels(id) ON DELETE SET NULL;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.provisioned_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  normalized_email text,
  cpf text,
  role text NOT NULL DEFAULT 'USER',
  org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'PENDING_SETUP',
  invited_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  activated_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS normalized_email text;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS token text;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING_SETUP';
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS invited_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.provisioned_invites ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.provisioned_invites
   SET normalized_email = lower(email)
 WHERE normalized_email IS NULL
   AND email IS NOT NULL;

UPDATE public.provisioned_invites
   SET token = encode(gen_random_bytes(24), 'hex')
 WHERE token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS provisioned_invites_token_uidx
  ON public.provisioned_invites (token)
  WHERE deleted_at IS NULL;

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

