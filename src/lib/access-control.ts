import type { FastifyRequest } from 'fastify';
import { AppError } from './errors.js';
import { adminRoleValues, type AuthenticatedAuthContext, type UserRole } from '../modules/auth/contracts/auth.types.js';
import type { ResolvedTenantContext } from '../modules/tenant/contracts/tenant.types.js';

interface RequireAuthenticatedOptions {
  allowFirstAccess?: boolean;
}

export function requireAuthenticatedRequest(
  request: FastifyRequest,
  options: RequireAuthenticatedOptions = {},
): AuthenticatedAuthContext {
  const auth = request.requireAuth();

  if (auth.actor.firstAccess && !options.allowFirstAccess) {
    throw new AppError(
      409,
      'PASSWORD_CHANGE_REQUIRED',
      'Password change is required before accessing this resource.',
    );
  }

  return auth;
}

export function requireTenantContext(request: FastifyRequest): ResolvedTenantContext {
  return request.requireTenant();
}

export function requireRole(request: FastifyRequest, allowedRoles: readonly UserRole[]): AuthenticatedAuthContext {
  const auth = requireAuthenticatedRequest(request);

  if (!allowedRoles.includes(auth.actor.role)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource.');
  }

  return auth;
}

export function requireAdminRole(request: FastifyRequest): AuthenticatedAuthContext {
  return requireRole(request, adminRoleValues);
}

export function assertTenantAccess(request: FastifyRequest, companyId: string): void {
  const auth = request.auth;

  if (auth.isAuthenticated && auth.actor.companyId !== companyId) {
    throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Tenant scope violation detected.');
  }

  if (request.tenant.isResolved && request.tenant.companyId !== companyId) {
    throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Tenant context does not match the resource scope.');
  }
}
