import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors.js';
import type { TenantContext } from '../modules/tenant/contracts/tenant.types.js';
import { tenantHintHeadersSchema } from '../schemas/headers.js';
import type { ResolvedTenantContext } from '../modules/tenant/contracts/tenant.types.js';

function requireTenant(this: FastifyRequest): ResolvedTenantContext {
  if (!this.tenant.isResolved || !this.tenant.companyId) {
    throw new AppError(400, 'TENANT_CONTEXT_REQUIRED', 'A resolved tenant context is required.');
  }

  return this.tenant;
}

const tenantContextStore = new WeakMap<FastifyRequest, TenantContext>();
const defaultTenantContext: TenantContext = {
  isResolved: false,
  source: 'none',
  companyId: null,
  slug: null,
  trusted: false,
};

export const tenantContextPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('tenant', {
    getter(this: FastifyRequest) {
      return tenantContextStore.get(this) ?? defaultTenantContext;
    },
    setter(this: FastifyRequest, value: TenantContext) {
      tenantContextStore.set(this, value);
    },
  });
  app.decorateRequest('requireTenant', requireTenant);

  app.addHook('onRequest', async (request) => {
    const headers = tenantHintHeadersSchema.parse({
      'x-tenant-slug': request.headers['x-tenant-slug'],
    });

    if (request.auth.isAuthenticated && request.auth.actor) {
      request.tenant = {
        isResolved: true,
        source: 'session',
        companyId: request.auth.actor.companyId,
        slug: headers['x-tenant-slug'] ?? null,
        trusted: true,
      };

      return;
    }

    if (headers['x-tenant-slug']) {
      const publicTenant = await app.services.company.resolvePublicTenant(headers['x-tenant-slug']);

      if (publicTenant) {
        request.tenant = {
          isResolved: true,
          source: 'header',
          companyId: publicTenant.id,
          slug: publicTenant.slug,
          trusted: false,
        };
      } else {
        request.tenant = {
          isResolved: false,
          source: 'header',
          companyId: null,
          slug: headers['x-tenant-slug'],
          trusted: false,
        };
      }

      return;
    }

    request.tenant = {
      isResolved: false,
      source: 'none',
      companyId: null,
      slug: null,
      trusted: false,
    };
  });
};
