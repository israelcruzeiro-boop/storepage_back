import { z } from 'zod';

export const tenantSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Tenant slug must use lowercase letters, numbers and hyphens only.');

export const entityIdSchema = z.string().uuid();
export const emailSchema = z.string().trim().email().max(254);
export const nullableUrlSchema = z.string().trim().url().max(2048).nullable();
export const personNameSchema = z.string().trim().min(2).max(120);
export const shortTextSchema = z.string().trim().min(1).max(160);
export const passwordSchema = z.string().min(8).max(128);
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Color must be a valid hex value.');
export const cpfInputSchema = z
  .string()
  .trim()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF must contain 11 digits.');
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
});
