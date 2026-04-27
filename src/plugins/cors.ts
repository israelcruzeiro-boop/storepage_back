import type { FastifyPluginAsync } from 'fastify';
import { AppError } from '../lib/errors.js';

const ALLOW_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const ALLOW_HEADERS = 'Authorization,Content-Type,X-Tenant-Slug,X-Request-Id,X-Request-Source';

function getAllowedOrigin(origin: string, configuredOrigins: readonly string[]): string | null {
  if (configuredOrigins.includes('*')) {
    return '*';
  }

  return configuredOrigins.includes(origin) ? origin : null;
}

export const corsPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;

    if (!origin) {
      return;
    }

    const allowedOrigin = getAllowedOrigin(origin, app.config.CORS_ORIGINS);

    if (!allowedOrigin) {
      throw new AppError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed for this API.');
    }

    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Origin', allowedOrigin);
    reply.header('Access-Control-Allow-Methods', ALLOW_METHODS);
    reply.header('Access-Control-Allow-Headers', ALLOW_HEADERS);
    reply.header('Access-Control-Max-Age', '600');

    if (app.config.CORS_ALLOW_CREDENTIALS && allowedOrigin !== '*') {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });
};
