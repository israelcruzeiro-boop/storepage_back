import type { FastifyInstance } from 'fastify';
import { authContextPlugin } from './auth-context.js';
import { corsPlugin } from './cors.js';
import { errorHandlerPlugin } from './error-handler.js';
import { responseEnvelopePlugin } from './response-envelope.js';
import { securityHeadersPlugin } from './security-headers.js';
import { tenantContextPlugin } from './tenant-context.js';

export async function registerBasePlugins(app: FastifyInstance): Promise<void> {
  await responseEnvelopePlugin(app, {});
  await securityHeadersPlugin(app, {});
  await corsPlugin(app, {});
  await authContextPlugin(app, {});
  await tenantContextPlugin(app, {});
  await errorHandlerPlugin(app, {});
}
