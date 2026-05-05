-- Restrict the SECURITY DEFINER hierarchy transition RPC to backend service role.
-- This migration is intentionally metadata-only: it does not change function logic.

DO $$
DECLARE
  signature text;
  target_function regprocedure;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.storepage_insert_parent_level(uuid, uuid, text, jsonb, text, jsonb)',
    'public.storepage_insert_parent_level(uuid, uuid, text, text[], text, uuid[])'
  ]
  LOOP
    target_function := to_regprocedure(signature);

    IF target_function IS NULL THEN
      RAISE NOTICE 'Function % not found; skipping permission hardening.', signature;
      CONTINUE;
    END IF;

    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', signature);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
