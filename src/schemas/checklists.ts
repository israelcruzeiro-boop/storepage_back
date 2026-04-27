import { z } from 'zod';
import {
  actionPlanPriorityValues,
  actionPlanStatusValues,
  checklistAccessTypeValues,
  checklistQuestionTypeValues,
  checklistStatusValues,
  submissionStatusValues,
} from '../modules/checklists/contracts/checklists.types.js';

/* ---- Shared param schemas ---- */
export const checklistIdParamsSchema = z.object({ id: z.string().uuid() });
export const folderIdParamsSchema = z.object({ id: z.string().uuid() });
export const sectionIdParamsSchema = z.object({ id: z.string().uuid() });
export const questionIdParamsSchema = z.object({ id: z.string().uuid() });
export const submissionIdParamsSchema = z.object({ id: z.string().uuid() });
export const actionPlanIdParamsSchema = z.object({ id: z.string().uuid() });
export const answerParamsSchema = z.object({ id: z.string().uuid(), questionId: z.string().uuid() });

const nullableStringSchema = z.string().trim().nullable().optional();
const idArraySchema = z.array(z.string().uuid()).default([]);

/* ---- Checklist CRUD ---- */
export const createChecklistBodySchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional().default(''),
  coverImage: nullableStringSchema,
  status: z.enum(checklistStatusValues).default('DRAFT'),
  accessType: z.enum(checklistAccessTypeValues).default('ALL'),
  allowedUserIds: idArraySchema,
  allowedRegionIds: idArraySchema,
  allowedStoreIds: idArraySchema,
  folderId: z.string().uuid().nullable().optional(),
});

export const updateChecklistBodySchema = createChecklistBodySchema.partial();

/* ---- Folder CRUD ---- */
export const createFolderBodySchema = z.object({
  name: z.string().trim().min(1),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateFolderBodySchema = createFolderBodySchema.partial();

/* ---- Section CRUD ---- */
export const createSectionBodySchema = z.object({
  title: z.string().trim().min(1),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateSectionBodySchema = createSectionBodySchema.partial();

/* ---- Question CRUD ---- */
export const createQuestionBodySchema = z.object({
  questionText: z.string().trim().min(1),
  questionType: z.enum(checklistQuestionTypeValues).default('YES_NO'),
  required: z.boolean().default(false),
  configuration: z.unknown().nullable().optional(),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateQuestionBodySchema = createQuestionBodySchema.partial();

/* ---- Reorder ---- */
export const reorderBodySchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    }),
  ).min(1),
});

/* ---- Submission ---- */
export const createSubmissionBodySchema = z.object({
  orgUnitId: z.string().uuid().nullable().optional(),
});

/* ---- Answer upsert ---- */
export const upsertAnswerBodySchema = z.object({
  value: z.unknown().nullable().optional(),
  textValue: z.string().nullable().optional(),
  numericValue: z.number().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  attachmentUrls: z.array(z.string().url()).optional().default([]),
  photoUrls: z.array(z.string().url()).optional(),
  conformity: z.enum(['CONFORMING', 'NON_CONFORMING', 'NOT_APPLICABLE']).nullable().optional(),
  notes: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  actionPlan: z.string().nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  actionPlanDueDate: z.string().nullable().optional(),
  actionPlanCreatedBy: z.string().uuid().nullable().optional(),
});

/* ---- Action Plan ---- */
export const createActionPlanBodySchema = z.object({
  submissionId: z.string().uuid().nullable().optional(),
  answerId: z.string().uuid().nullable().optional(),
  checklistId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(''),
  status: z.enum(actionPlanStatusValues).default('OPEN'),
  priority: z.enum(actionPlanPriorityValues).default('MEDIUM'),
  assigneeUserId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateActionPlanBodySchema = createActionPlanBodySchema.partial();

/* ---- Query filters ---- */
export const submissionsQuerySchema = z.object({
  checklistId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(submissionStatusValues).optional(),
}).optional();

export const actionPlansQuerySchema = z.object({
  submissionId: z.string().uuid().optional(),
  assigneeUserId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  scope: z.enum(['all', 'received', 'sent']).optional(),
}).optional();
