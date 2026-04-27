import { z } from 'zod';
import { emailSchema, hexColorSchema, nullableUrlSchema, personNameSchema, shortTextSchema, tenantSlugSchema } from './shared.js';

const themePatchSchema = z
  .object({
    primary: hexColorSchema.optional(),
    secondary: hexColorSchema.optional(),
    accent: hexColorSchema.optional(),
    surface: hexColorSchema.optional(),
    text: hexColorSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one theme field must be provided.',
  });

const heroPatchSchema = z
  .object({
    title: shortTextSchema.optional(),
    subtitle: z.string().trim().min(1).max(320).optional(),
    ctaLabel: z.string().trim().min(1).max(80).nullable().optional(),
    imageUrl: nullableUrlSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one hero field must be provided.',
  });

export const publicCompanyParamsSchema = z.object({
  slug: tenantSlugSchema,
});

export const companiesListQuerySchema = z.object({
  includeDeleted: z.coerce.boolean().default(false),
});

export const updateAppearanceBodySchema = z
  .object({
    logoUrl: nullableUrlSchema.optional(),
    faviconUrl: nullableUrlSchema.optional(),
    theme: themePatchSchema.optional(),
    hero: heroPatchSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one appearance field must be provided.',
  });

export const updateFeaturesBodySchema = z
  .object({
    repositories: z.boolean().optional(),
    lms: z.boolean().optional(),
    checklists: z.boolean().optional(),
    surveys: z.boolean().optional(),
    metrics: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one feature flag must be provided.',
  });

export const updateGeneralBodySchema = z
  .object({
    name: personNameSchema.max(160).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    active: z.boolean().optional(),
    orgLevels: z.array(z.string().trim().min(2).max(60)).min(1).max(8).optional(),
    orgUnitName: z.string().trim().min(2).max(60).optional(),
    supportEmail: emailSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one general setting must be provided.',
  });
