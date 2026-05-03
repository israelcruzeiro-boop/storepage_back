-- Anchors the legacy production super admin to the active Everest company so
-- the backend can issue tenant-scoped JWT sessions.
WITH anchor AS (
  SELECT id
    FROM public.companies
   WHERE deleted_at IS NULL
     AND active IS TRUE
     AND status = 'ACTIVE'
     AND (slug = 'everest' OR link_name = 'everest')
   ORDER BY id
   LIMIT 1
)
UPDATE public.users
   SET company_id = (SELECT id FROM anchor),
       updated_at = now()
 WHERE role = 'SUPER_ADMIN'
   AND normalized_email = 'sadmin@storepage.com'
   AND company_id IS NULL
   AND deleted_at IS NULL
   AND EXISTS (SELECT 1 FROM anchor)
RETURNING id, email, company_id;
