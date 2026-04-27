import 'fastify';
import type { AppEnv } from '../config/env.js';
import type { AppRepositories, AppServices } from '../lib/app-container.js';
import type { AuthContext, AuthenticatedAuthContext } from '../modules/auth/contracts/auth.types.js';
import type { TenantContext, ResolvedTenantContext } from '../modules/tenant/contracts/tenant.types.js';
import type { ReplySuccessOptions } from './api.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppEnv;
    repositories: AppRepositories;
    services: AppServices;
  }

  interface FastifyRequest {
    auth: AuthContext;
    tenant: TenantContext;
    requireAuth(): AuthenticatedAuthContext;
    requireTenant(): ResolvedTenantContext;
  }

  interface FastifyReply {
    success<T>(data: T, options?: ReplySuccessOptions): FastifyReply;
  }
}
