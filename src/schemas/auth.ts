import { z } from 'zod';
import { userRoleValues } from '../modules/auth/contracts/auth.types.js';
import {
  emailSchema,
  entityIdSchema,
  nullableUrlSchema,
  passwordSchema,
  personNameSchema,
  tenantSlugSchema,
} from './shared.js';

export const authenticatedActorSchema = z.object({
  subject: z.string().trim().min(1),
  role: z.enum(userRoleValues),
  companyId: z.string().trim().min(1),
  email: z.string().email().optional(),
});

export const tokenIdentitySchema = z.object({
  subject: z.string().trim().min(1),
  companyId: entityIdSchema,
  role: z.enum(userRoleValues).optional(),
  email: emailSchema.optional(),
  sessionId: entityIdSchema.optional(),
  tokenUse: z.enum(['access', 'refresh']).optional(),
  refreshTokenId: entityIdSchema.optional(),
});

export const tenantSlugParamsSchema = z.object({
  slug: tenantSlugSchema,
});

export const inviteTokenParamsSchema = z.object({
  token: z
    .string()
    .trim()
    .min(20)
    .max(200)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invite token format is invalid.'),
});

export const loginBodySchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
  company_slug: tenantSlugSchema.optional(),
});

export const activateInviteBodySchema = z.object({
  email: emailSchema,
  cpf: z.string().trim().optional(),
  password: passwordSchema,
  avatarUrl: nullableUrlSchema.optional(),
  name: personNameSchema.optional(),
  orgUnitId: entityIdSchema.nullable().optional(),
}).strict();

export const inviteSessionBodySchema = z.object({
  token: inviteTokenParamsSchema.shape.token,
}).strict();

export const profileUpdateBodySchema = z
  .object({
    name: personNameSchema.optional(),
    email: emailSchema.optional(),
    avatarUrl: nullableUrlSchema.optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one profile field must be provided.',
  });

export const passwordUpdateBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
