import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import type { AuthContext, AuthenticatedAuthContext } from '../modules/auth/contracts/auth.types.js';

const authHeaderSchema = z.object({
  authorization: z.string().trim().max(8192).optional(),
});

function extractBearerToken(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization);

  if (!match || match[1].trim().length === 0) {
    throw new AppError(400, 'INVALID_AUTH_HEADER', 'Authorization header must use the Bearer scheme.');
  }

  return match[1].trim();
}

function requireAuth(this: FastifyRequest): AuthenticatedAuthContext {
  if (!this.auth.isAuthenticated || !this.auth.actor) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required to access this resource.');
  }

  return this.auth;
}

const authContextStore = new WeakMap<FastifyRequest, AuthContext>();
const defaultAuthContext: AuthContext = {
  isAuthenticated: false,
  strategy: 'none',
  actor: null,
  bearerToken: null,
  token: null,
};

export const authContextPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('auth', {
    getter(this: FastifyRequest) {
      return authContextStore.get(this) ?? defaultAuthContext;
    },
    setter(this: FastifyRequest, value: AuthContext) {
      authContextStore.set(this, value);
    },
  });
  app.decorateRequest('requireAuth', requireAuth);

  app.addHook('onRequest', async (request) => {
    const headers = authHeaderSchema.parse({
      authorization: request.headers.authorization,
    });
    const bearerToken = extractBearerToken(headers.authorization);
    request.auth = await app.services.authentication.resolveContext(bearerToken);
  });
};
