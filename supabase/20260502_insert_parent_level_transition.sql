DROP FUNCTION IF EXISTS public.storepage_insert_parent_level(uuid, uuid, text, text[], text, uuid[]);
DROP FUNCTION IF EXISTS public.storepage_insert_parent_level(uuid, uuid, text, jsonb, text, jsonb);

CREATE OR REPLACE FUNCTION public.storepage_insert_parent_level(
  p_company_id uuid,
  p_parent_id uuid,
  p_parent_name text,
  p_next_org_levels jsonb,
  p_org_unit_name text,
  p_child_top_level_ids jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
  v_current_org_levels_json jsonb;
  v_current_org_levels text[];
  v_next_org_levels text[];
  v_child_top_level_ids uuid[];
  v_existing_count integer;
  v_child_count integer;
  v_updated_count integer;
  v_has_cycle boolean;
BEGIN
  SELECT org_levels
    INTO v_current_org_levels_json
    FROM companies
   WHERE id = p_company_id
     AND deleted_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found.';
  END IF;

  IF jsonb_typeof(p_next_org_levels) IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_child_top_level_ids) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Parent-level transition payload must contain array fields.';
  END IF;

  IF jsonb_typeof(v_current_org_levels_json) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Current hierarchy levels must be stored as an array.';
  END IF;

  SELECT coalesce(array_agg(value), ARRAY[]::text[])
    INTO v_current_org_levels
    FROM jsonb_array_elements_text(v_current_org_levels_json) AS value;

  SELECT coalesce(array_agg(value), ARRAY[]::text[])
    INTO v_next_org_levels
    FROM jsonb_array_elements_text(p_next_org_levels) AS value;

  SELECT coalesce(array_agg(value::uuid), ARRAY[]::uuid[])
    INTO v_child_top_level_ids
    FROM jsonb_array_elements_text(p_child_top_level_ids) AS value;

  IF coalesce(array_length(v_current_org_levels, 1), 0) <> 1
     OR coalesce(array_length(v_next_org_levels, 1), 0) <> 2 THEN
    RAISE EXCEPTION 'Parent-level transition requires a current single-level hierarchy and exactly two next levels.';
  END IF;

  IF v_next_org_levels[2] IS DISTINCT FROM v_current_org_levels[1] THEN
    RAISE EXCEPTION 'Existing hierarchy level must be preserved as the new second level.';
  END IF;

  IF p_parent_id IS NULL OR nullif(btrim(p_parent_name), '') IS NULL THEN
    RAISE EXCEPTION 'Parent hierarchy node is required.';
  END IF;

  SELECT count(*)
    INTO v_existing_count
    FROM org_top_levels
   WHERE company_id = p_company_id
     AND deleted_at IS NULL;

  SELECT count(DISTINCT id)
    INTO v_child_count
    FROM org_top_levels
   WHERE company_id = p_company_id
     AND deleted_at IS NULL
     AND level_index = 1
     AND id = ANY(v_child_top_level_ids);

  IF v_existing_count = 0
     OR v_child_count <> v_existing_count
     OR coalesce(array_length(v_child_top_level_ids, 1), 0) <> v_existing_count THEN
    RAISE EXCEPTION 'Every existing leaf hierarchy node must be mapped exactly once.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM org_top_levels
     WHERE company_id = p_company_id
       AND deleted_at IS NULL
       AND level_index <> 1
  ) THEN
    RAISE EXCEPTION 'Hierarchy already has non-leaf nodes and cannot use this transition.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM org_top_levels child
     WHERE child.company_id = p_company_id
       AND child.deleted_at IS NULL
       AND child.parent_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
           FROM org_top_levels parent
          WHERE parent.company_id = p_company_id
            AND parent.deleted_at IS NULL
            AND parent.id = child.parent_id
       )
  ) THEN
    RAISE EXCEPTION 'Existing hierarchy parent belongs to another tenant or no longer exists.';
  END IF;

  WITH RECURSIVE parent_walk AS (
    SELECT
      id AS start_id,
      id AS current_id,
      parent_id,
      ARRAY[id] AS path,
      false AS has_cycle
      FROM org_top_levels
     WHERE company_id = p_company_id
       AND deleted_at IS NULL
    UNION ALL
    SELECT
      parent_walk.start_id,
      parent.id AS current_id,
      parent.parent_id,
      parent_walk.path || parent.id,
      parent.id = ANY(parent_walk.path) AS has_cycle
      FROM parent_walk
      JOIN org_top_levels parent
        ON parent.id = parent_walk.parent_id
       AND parent.company_id = p_company_id
       AND parent.deleted_at IS NULL
     WHERE parent_walk.parent_id IS NOT NULL
       AND NOT parent_walk.has_cycle
  )
  SELECT EXISTS(SELECT 1 FROM parent_walk WHERE has_cycle)
    INTO v_has_cycle;

  IF v_has_cycle THEN
    RAISE EXCEPTION 'Existing hierarchy contains a parent cycle.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM org_units u
     WHERE u.company_id = p_company_id
       AND u.deleted_at IS NULL
       AND (
         u.top_level_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
             FROM org_top_levels t
            WHERE t.company_id = p_company_id
              AND t.deleted_at IS NULL
              AND t.level_index = 1
              AND t.id = u.top_level_id
         )
       )
  ) THEN
    RAISE EXCEPTION 'All units must be linked to an existing leaf hierarchy node before inserting a parent level.';
  END IF;

  INSERT INTO org_top_levels (
    id,
    company_id,
    name,
    level_index,
    parent_id,
    deleted_at,
    created_at,
    updated_at
  )
  VALUES (
    p_parent_id,
    p_company_id,
    btrim(p_parent_name),
    1,
    NULL,
    NULL,
    v_now,
    v_now
  );

  UPDATE org_top_levels
     SET level_index = 2,
         parent_id = p_parent_id,
         updated_at = v_now
   WHERE company_id = p_company_id
     AND deleted_at IS NULL
     AND id = ANY(v_child_top_level_ids);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> v_existing_count THEN
    RAISE EXCEPTION 'Could not move every existing leaf hierarchy node.';
  END IF;

  UPDATE companies
     SET org_levels = p_next_org_levels,
         org_unit_name = coalesce(nullif(btrim(p_org_unit_name), ''), org_unit_name),
         updated_at = v_now
   WHERE id = p_company_id
     AND deleted_at IS NULL;

  RETURN jsonb_build_object(
    'parentTopLevelId', p_parent_id,
    'movedTopLevelIds', v_child_top_level_ids
  );
END;
$$;
