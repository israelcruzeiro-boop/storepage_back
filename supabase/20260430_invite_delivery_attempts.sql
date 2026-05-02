-- StorePage invite delivery audit support.
-- Run after 20260428_phase7_production_adapter_compat.sql.

CREATE TABLE IF NOT EXISTS public.invite_delivery_attempts (
  id uuid PRIMARY KEY,
  invite_id uuid NOT NULL REFERENCES public.provisioned_invites(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('manual', 'email')),
  provider text NOT NULL CHECK (provider IN ('noop', 'smtp')),
  status text NOT NULL CHECK (status IN ('manual_delivery_pending', 'sent', 'failed')),
  error_code text,
  requested_by_user_id uuid NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invite_delivery_attempts_company_invite_created_idx
  ON public.invite_delivery_attempts (company_id, invite_id, created_at DESC);

ALTER TABLE public.invite_delivery_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages invite delivery attempts" ON public.invite_delivery_attempts;
CREATE POLICY "Service role manages invite delivery attempts"
  ON public.invite_delivery_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
