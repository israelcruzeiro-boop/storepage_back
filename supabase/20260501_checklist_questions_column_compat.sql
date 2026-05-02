-- Additive compatibility for checklist_questions column aliases.
-- Keeps RLS untouched and avoids drop/rename operations.

ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS config jsonb;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS checklist_id uuid REFERENCES public.checklists(id) ON DELETE CASCADE;

ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS question_text text;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS question_type text;
ALTER TABLE public.checklist_questions ADD COLUMN IF NOT EXISTS configuration jsonb;

UPDATE public.checklist_questions
SET
  text = COALESCE(NULLIF(text, ''), question_text),
  type = CASE
    WHEN type IS NULL OR (type = 'COMPLIANCE' AND question_type IS NOT NULL AND question_type <> 'COMPLIANCE')
      THEN question_type
    ELSE type
  END,
  config = COALESCE(config, configuration)
WHERE
  (text IS NULL OR text = '') AND question_text IS NOT NULL
  OR (type IS NULL OR (type = 'COMPLIANCE' AND question_type IS NOT NULL AND question_type <> 'COMPLIANCE'))
  OR (config IS NULL AND configuration IS NOT NULL);

UPDATE public.checklist_questions
SET
  question_text = COALESCE(NULLIF(question_text, ''), text),
  question_type = COALESCE(NULLIF(question_type, ''), type),
  configuration = COALESCE(configuration, config)
WHERE
  (question_text IS NULL OR question_text = '') AND text IS NOT NULL
  OR (question_type IS NULL OR question_type = '') AND type IS NOT NULL
  OR (configuration IS NULL AND config IS NOT NULL);

UPDATE public.checklist_questions q
SET checklist_id = s.checklist_id
FROM public.checklist_sections s
WHERE q.checklist_id IS NULL
  AND q.section_id = s.id;
