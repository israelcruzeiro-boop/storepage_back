import { z } from 'zod';
import { successEnvelopeSchema } from './http.js';

export const systemInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z.string(),
  phase: z.literal('0-foundation'),
  apiPrefix: z.string(),
  capabilities: z.object({
    auth: z.enum(['disabled', 'jwt']),
    tenantContext: z.enum(['jwt-derived', 'placeholder']),
    dataAccess: z.literal('interfaces-only'),
  }),
  entrypoints: z.object({
    root: z.string(),
    api: z.string(),
    health: z.string(),
    readiness: z.string(),
  }),
});

export const healthReportSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  uptimeSeconds: z.number().nonnegative(),
});

export const readinessCheckSchema = z.object({
  name: z.string(),
  status: z.enum(['pass', 'warn', 'fail']),
  detail: z.string(),
});

export const readinessReportSchema = z.object({
  status: z.literal('ready'),
  timestamp: z.string().datetime(),
  checks: z.array(readinessCheckSchema),
});

export const systemInfoResponseSchema = successEnvelopeSchema(systemInfoSchema);
export const healthResponseSchema = successEnvelopeSchema(healthReportSchema);
export const readinessResponseSchema = successEnvelopeSchema(readinessReportSchema);
