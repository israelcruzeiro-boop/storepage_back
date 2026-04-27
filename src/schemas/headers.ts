import { z } from 'zod';
import { tenantSlugSchema } from './shared.js';

export const tenantHintHeadersSchema = z.object({
  'x-tenant-slug': tenantSlugSchema.optional(),
});
