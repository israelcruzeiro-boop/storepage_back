-- Align LMS enrollments with the backend identity model.
--
-- The backend authenticates users from public.users. Some legacy databases still
-- have course_enrollments.user_id constrained to auth.users(id), which blocks
-- enrollment creation for valid application users.
DO $$
DECLARE
  fk_name text;
BEGIN
  FOR fk_name IN
    SELECT pgc.conname
    FROM pg_constraint pgc
    JOIN pg_attribute pga
      ON pga.attrelid = pgc.conrelid
      AND pga.attnum = ANY (pgc.conkey)
    WHERE pgc.contype = 'f'
      AND pgc.conrelid = 'public.course_enrollments'::regclass
      AND pga.attname = 'user_id'
      AND pgc.confrelid <> 'public.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS %I', fk_name);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'course_enrollments'
      AND constraint_name = 'course_enrollments_user_id_public_users_fkey'
  ) THEN
    ALTER TABLE public.course_enrollments
      ADD CONSTRAINT course_enrollments_user_id_public_users_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.users(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;
