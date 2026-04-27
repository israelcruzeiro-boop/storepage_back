import { z } from 'zod';
import {
  courseAccessTypeValues,
  courseContentTypeValues,
  courseQuestionTypeValues,
  courseStatusValues,
} from '../modules/lms/contracts/lms.types.js';

export const courseIdParamsSchema = z.object({ id: z.string().uuid() });
export const moduleIdParamsSchema = z.object({ id: z.string().uuid() });
export const contentIdParamsSchema = z.object({ id: z.string().uuid() });
export const questionIdParamsSchema = z.object({ id: z.string().uuid() });
export const enrollmentIdParamsSchema = z.object({ id: z.string().uuid() });
export const quizIdParamsSchema = z.object({ id: z.string().uuid() });

const nullableStringSchema = z.string().trim().nullable().optional();
const idArraySchema = z.array(z.string().uuid()).default([]);

export const createCourseBodySchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional().default(''),
  thumbnailUrl: nullableStringSchema,
  coverImage: nullableStringSchema,
  imageUrl: nullableStringSchema,
  status: z.enum(courseStatusValues).default('DRAFT'),
  accessType: z.enum(courseAccessTypeValues).default('ALL'),
  allowedUserIds: idArraySchema,
  allowedRegionIds: idArraySchema,
  allowedStoreIds: idArraySchema,
  excludedUserIds: idArraySchema,
  targetAudience: z.array(z.string()).default([]),
  passingScore: z.number().int().min(0).max(100).default(70),
  diplomaTemplate: z.string().trim().default('azul'),
});

export const updateCourseBodySchema = createCourseBodySchema.partial();

export const createModuleBodySchema = z.object({
  title: z.string().trim().min(1),
  orderIndex: z.number().int().min(0).default(0),
});

export const updateModuleBodySchema = createModuleBodySchema.partial();

export const createContentBodySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(''),
  type: z.enum(courseContentTypeValues),
  url: z.string().optional().default(''),
  contentUrl: nullableStringSchema,
  filePath: nullableStringSchema,
  sizeBytes: z.number().int().min(0).nullable().optional(),
  htmlContent: nullableStringSchema,
  orderIndex: z.number().int().min(0).default(0),
});

export const updateContentBodySchema = createContentBodySchema.partial();

const questionOptionBodySchema = z.object({
  id: z.string().uuid().optional().nullable(),
  optionText: z.string().trim().min(1),
  isCorrect: z.boolean().default(false),
  orderIndex: z.number().int().min(0).default(0),
});

export const createQuestionBodySchema = z.object({
  questionText: z.string().trim().min(1),
  questionType: z.enum(courseQuestionTypeValues).default('MULTIPLE_CHOICE'),
  configuration: z.unknown().nullable().optional(),
  imageUrl: nullableStringSchema,
  explanation: z.string().trim().nullable().optional(),
  orderIndex: z.number().int().min(0).default(0),
  options: z.array(questionOptionBodySchema).optional().default([]),
});

export const updateQuestionBodySchema = createQuestionBodySchema.partial();

export const updateEnrollmentProgressBodySchema = z.object({
  moduleId: z.string().uuid().nullable().optional(),
  contentId: z.string().uuid().nullable().optional(),
});

export const submitCourseAnswerBodySchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().nullable().optional(),
  complexAnswer: z.unknown().nullable().optional(),
  isCorrect: z.boolean(),
});

export const completeEnrollmentBodySchema = z.object({
  totalCorrect: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
  startedAt: z.string().datetime().optional(),
});

export const resetEnrollmentBodySchema = z.object({
  userId: z.string().uuid(),
});

export const quizQuerySchema = z
  .object({
    contentId: z.string().uuid().optional(),
    courseContentId: z.string().uuid().optional(),
  })
  .refine((query) => query.contentId || query.courseContentId, {
    message: 'contentId or courseContentId is required.',
  });

export const submitQuizAttemptBodySchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  answers: z.record(z.string(), z.string()).default({}),
});
