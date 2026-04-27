import { z } from 'zod';
import { entityIdSchema, paginationQuerySchema, personNameSchema } from './shared.js';

export const structureQuerySchema = paginationQuerySchema;

export const structureEntityParamsSchema = z.object({
  id: entityIdSchema,
});

export const createTopLevelBodySchema = z.object({
  name: personNameSchema,
  levelIndex: z.coerce.number().int().min(1).max(8),
  parentId: entityIdSchema.nullable().optional(),
});

export const updateTopLevelBodySchema = z
  .object({
    name: personNameSchema.optional(),
    levelIndex: z.coerce.number().int().min(1).max(8).optional(),
    parentId: entityIdSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one top-level field must be provided.',
  });

export const createUnitBodySchema = z.object({
  name: personNameSchema,
  code: z.string().trim().min(1).max(40).nullable().optional(),
  topLevelId: entityIdSchema.nullable().optional(),
  active: z.boolean().default(true),
});

export const updateUnitBodySchema = z
  .object({
    name: personNameSchema.optional(),
    code: z.string().trim().min(1).max(40).nullable().optional(),
    topLevelId: entityIdSchema.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one unit field must be provided.',
  });
