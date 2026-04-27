import type { FastifyPluginAsync } from 'fastify';
import { requireRole } from '../lib/access-control.js';
import {
  companyIdParamsSchema,
  provisionAdminBodySchema,
  superAdminCompaniesQuerySchema,
  superAdminCompanyStatusBodySchema,
  superAdminCreateCompanyBodySchema,
  superAdminUpdateCompanyBodySchema,
  superAdminUpdateUserBodySchema,
  superAdminUserStatusBodySchema,
  superAdminUsersQuerySchema,
} from '../schemas/super-admin.js';
import { userIdParamsSchema } from '../schemas/users.js';

/**
 * `POST /api/super-admin/companies/:id/provision-admin`
 *
 * Replaces the legacy `supabase.rpc('provision_invite')` call used by the
 * super-admin Dashboard to invite a tenant administrator. The route enforces
 * SUPER_ADMIN role; the service double-checks tenant existence and normalizes
 * the input before delegating to the database function.
 */
export const superAdminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/super-admin/companies', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const query = superAdminCompaniesQuerySchema.parse(request.query);
    const data = await app.services.superAdmin.listCompanies(auth.actor, query.includeDeleted);

    return reply.success(data, {
      message: 'Companies loaded successfully.',
    });
  });

  app.post('/super-admin/companies', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const body = superAdminCreateCompanyBodySchema.parse(request.body);
    const data = await app.services.superAdmin.createCompany(auth.actor, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Company created successfully.',
    });
  });

  app.put('/super-admin/companies/:id', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const params = companyIdParamsSchema.parse(request.params);
    const body = superAdminUpdateCompanyBodySchema.parse(request.body);
    const data = await app.services.superAdmin.updateCompany(auth.actor, params.id, body);

    return reply.success(data, {
      message: 'Company updated successfully.',
    });
  });

  app.delete('/super-admin/companies/:id', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const params = companyIdParamsSchema.parse(request.params);
    const data = await app.services.superAdmin.deleteCompany(auth.actor, params.id);

    return reply.success(data, {
      message: 'Company archived successfully.',
    });
  });

  app.patch('/super-admin/companies/:id/status', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const params = companyIdParamsSchema.parse(request.params);
    const body = superAdminCompanyStatusBodySchema.parse(request.body);
    const data = await app.services.superAdmin.updateCompanyStatus(auth.actor, params.id, body.active);

    return reply.success(data, {
      message: 'Company status updated successfully.',
    });
  });

  app.get('/super-admin/users', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const query = superAdminUsersQuerySchema.parse(request.query);
    const data = await app.services.superAdmin.listUsers(auth.actor, query);

    return reply.success(data, {
      message: 'Users and pending invites loaded successfully.',
    });
  });

  app.put('/super-admin/users/:id', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const params = userIdParamsSchema.parse(request.params);
    const body = superAdminUpdateUserBodySchema.parse(request.body);
    const data = await app.services.superAdmin.updateUser(auth.actor, params.id, body);

    return reply.success(data, {
      message: 'User updated successfully.',
    });
  });

  app.patch('/super-admin/users/:id/status', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const params = userIdParamsSchema.parse(request.params);
    const body = superAdminUserStatusBodySchema.parse(request.body);
    const data = await app.services.superAdmin.updateUserStatus(auth.actor, params.id, body.active);

    return reply.success(data, {
      message: 'User status updated successfully.',
    });
  });

  app.post('/super-admin/companies/:id/provision-admin', async (request, reply) => {
    const auth = requireRole(request, ['SUPER_ADMIN']);
    const params = companyIdParamsSchema.parse(request.params);
    const body = provisionAdminBodySchema.parse(request.body);

    const data = await app.services.superAdmin.provisionAdmin(auth.actor, {
      companyId: params.id,
      name: body.name,
      email: body.email,
      role: body.role,
    });

    return reply.success(data, {
      statusCode: 201,
      message: 'Tenant administrator provisioned successfully.',
    });
  });
};
