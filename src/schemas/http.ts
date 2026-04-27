import { z } from 'zod';

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
});

export function successEnvelopeSchema<TSchema extends z.ZodTypeAny>(dataSchema: TSchema) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string(),
  });
}
