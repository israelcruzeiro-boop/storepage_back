import { z } from 'zod';
import { userRoleValues } from '../modules/auth/contracts/auth.types.js';
import { userStatusValues } from '../modules/user/contracts/user.types.js';
import { cpfInputSchema, emailSchema, entityIdSchema, nullableUrlSchema, paginationQuerySchema, personNameSchema } from './shared.js';

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ALL', ...userStatusValues]).default('ALL'),
});

export const userIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const inviteIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const createInviteBodySchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  cpf: cpfInputSchema.nullable().optional(),
  role: z.enum(userRoleValues),
  orgUnitId: entityIdSchema.nullable().optional(),
});

export const updateUserBodySchema = z
  .object({
    name: personNameSchema.optional(),
    email: emailSchema.optional(),
    cpf: cpfInputSchema.nullable().optional(),
    role: z.enum(userRoleValues).optional(),
    status: z.enum(userStatusValues).optional(),
    active: z.boolean().optional(),
    avatarUrl: nullableUrlSchema.optional(),
    orgUnitId: entityIdSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one user field must be provided.',
  });

export const selfProfileUpdateBodySchema = z
  .object({
    onboardingCompleted: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one profile field must be provided.',
  });
