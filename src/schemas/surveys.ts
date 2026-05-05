import { z } from 'zod';
import { entityIdSchema, paginationQuerySchema, restrictedAccessBodyHasTarget, restrictedAccessTargetMessage } from './shared.js';

export const surveyIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const surveyQuestionIdParamsSchema = z.object({
  id: entityIdSchema,
});

const baseAnswerShape = { question_id: entityIdSchema };

const shortTextAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('SHORT_TEXT'),
    text: z.string(),
  }),
});

const longTextAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('LONG_TEXT'),
    text: z.string(),
  }),
});

const singleChoiceAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('SINGLE_CHOICE'),
    option_id: z.string().min(1),
    other_text: z.string().optional(),
  }),
});

const multipleChoiceAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('MULTIPLE_CHOICE'),
    option_ids: z.array(z.string().min(1)),
    other_text: z.string().optional(),
  }),
});

const ratingAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('RATING'),
    value: z.number().int().min(0),
  }),
});

const npsAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('NPS'),
    value: z.number().int().min(0).max(10),
  }),
});

const dateAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('DATE'),
    date: z.string().min(1),
  }),
});

const numberAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('NUMBER'),
    value: z.number(),
  }),
});

const yesNoAnswerSchema = z.object({
  ...baseAnswerShape,
  value: z.object({
    type: z.literal('YES_NO'),
    value: z.boolean(),
  }),
});

// Accept any answer shape — discriminator lives on `value.type` inside the
// payload, but z.union keeps validation portable across zod versions.
const submitAnswerSchema = z.union([
  shortTextAnswerSchema,
  longTextAnswerSchema,
  singleChoiceAnswerSchema,
  multipleChoiceAnswerSchema,
  ratingAnswerSchema,
  npsAnswerSchema,
  dateAnswerSchema,
  numberAnswerSchema,
  yesNoAnswerSchema,
]);

export const submitSurveyResponseBodySchema = z.object({
  started_at: z.string().datetime().nullable().optional(),
  answers: z.array(submitAnswerSchema).min(1, 'At least one answer is required.'),
});

export type SubmitSurveyResponseBody = z.infer<typeof submitSurveyResponseBodySchema>;

const surveyStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
const surveyAccessTypeSchema = z.enum(['ALL', 'RESTRICTED']);
const surveyQuestionTypeSchema = z.enum([
  'SHORT_TEXT',
  'LONG_TEXT',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'RATING',
  'NPS',
  'DATE',
  'NUMBER',
  'YES_NO',
]);

const surveyBodyShape = {
  title: z.string().trim().min(1).max(180),
  description: z.string().nullable().optional(),
  status: surveyStatusSchema.optional(),
  accessType: surveyAccessTypeSchema.optional(),
  allowedUserIds: z.array(entityIdSchema).optional(),
  allowedRegionIds: z.array(entityIdSchema).optional(),
  allowedStoreIds: z.array(entityIdSchema).optional(),
  excludedUserIds: z.array(entityIdSchema).optional(),
  allowMultipleResponses: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  coverImage: z.string().nullable().optional(),
};

export const createSurveyBodySchema = z.object(surveyBodyShape).strict().refine(
  (value) => value.accessType !== 'RESTRICTED' || restrictedAccessBodyHasTarget(value),
  { message: restrictedAccessTargetMessage },
);
export const updateSurveyBodySchema = z.object(surveyBodyShape).partial().strict().refine(
  (value) => value.accessType !== 'RESTRICTED' || restrictedAccessBodyHasTarget(value),
  { message: restrictedAccessTargetMessage },
);

export const paginatedSurveysQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED']).default('ALL'),
});

const surveyQuestionBodyShape = {
  surveyId: entityIdSchema.optional(),
  questionText: z.string().trim().min(1).max(500),
  description: z.string().nullable().optional(),
  questionType: surveyQuestionTypeSchema,
  configuration: z.unknown(),
  required: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
};

export const createSurveyQuestionBodySchema = z.object(surveyQuestionBodyShape).strict();
export const updateSurveyQuestionBodySchema = z.object(surveyQuestionBodyShape).partial().strict();
export const saveSurveyQuestionBodySchema = z.object({
  ...surveyQuestionBodyShape,
  id: entityIdSchema.optional(),
}).strict();

export const reorderSurveyQuestionsBodySchema = z.object({
  items: z.array(z.object({
    id: entityIdSchema,
    orderIndex: z.number().int().min(0),
  })).min(1),
}).strict();
