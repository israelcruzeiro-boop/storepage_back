import { z } from 'zod';
import { userRoleValues } from '../modules/auth/contracts/auth.types.js';
import { userStatusValues } from '../modules/user/contracts/user.types.js';
import { emailSchema, entityIdSchema, nullableUrlSchema, paginationQuerySchema, personNameSchema, tenantSlugSchema } from './shared.js';

export const companyIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const provisionAdminBodySchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  role: z.enum(userRoleValues).optional(),
});

export const superAdminCompaniesQuerySchema = z.object({
  includeDeleted: z.coerce.boolean().default(false),
});

export const superAdminUsersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ALL', ...userStatusValues]).default('ALL'),
  includeDeleted: z.coerce.boolean().default(false),
  companyId: entityIdSchema.optional(),
});

const companyBodyFields = {
  name: personNameSchema.max(160),
  slug: tenantSlugSchema.optional(),
  linkName: tenantSlugSchema.optional(),
  logoUrl: nullableUrlSchema.optional(),
  active: z.boolean().optional(),
  landingPageEnabled: z.boolean().optional(),
  landingPageActive: z.boolean().optional(),
  landingPageLayout: z.string().trim().min(2).max(40).nullable().optional(),
  checklistsEnabled: z.boolean().optional(),
  surveysEnabled: z.boolean().optional(),
};

export const superAdminCreateCompanyBodySchema = z.object(companyBodyFields);

export const superAdminUpdateCompanyBodySchema = z
  .object({
    ...companyBodyFields,
    name: companyBodyFields.name.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one company field must be provided.',
  });

export const superAdminCompanyStatusBodySchema = z.object({
  active: z.boolean(),
});

export const superAdminUpdateUserBodySchema = z
  .object({
    name: personNameSchema.optional(),
    email: emailSchema.optional(),
    role: z.enum(userRoleValues).optional(),
    status: z.enum(userStatusValues).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one user field must be provided.',
  });

export const superAdminUserStatusBodySchema = z.object({
  active: z.boolean(),
});

export type ProvisionAdminBody = z.infer<typeof provisionAdminBodySchema>;
