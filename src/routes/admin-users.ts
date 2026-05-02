import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole } from '../lib/access-control.js';
import { adminUsersQuerySchema, createInviteBodySchema, inviteIdParamsSchema, updateUserBodySchema, userIdParamsSchema } from '../schemas/users.js';

export const adminUsersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/users', async (request, reply) => {
    const auth = requireAdminRole(request);
    const query = adminUsersQuerySchema.parse(request.query);
    const data = await app.services.adminUsers.listUsers(auth.actor, query);

    return reply.success(data, {
      message: 'Users and pending invites loaded successfully.',
    });
  });

  app.post('/admin/users/invite', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createInviteBodySchema.parse(request.body);
    const data = await app.services.adminUsers.createInvite(auth.actor, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'User created successfully.',
    });
  });

  app.delete('/admin/users/invites/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = inviteIdParamsSchema.parse(request.params);
    const data = await app.services.adminUsers.cancelInvite(auth.actor, params.id);

    return reply.success(data, {
      message: 'Invite cancelled successfully.',
    });
  });

  app.post('/admin/users/invites/:id/resend', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = inviteIdParamsSchema.parse(request.params);
    const data = await app.services.adminUsers.resendInvite(auth.actor, params.id);

    return reply.success(data, {
      message: 'Invite delivery requested successfully.',
    });
  });

  app.get('/admin/users/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = userIdParamsSchema.parse(request.params);
    const data = await app.services.adminUsers.getUser(auth.actor, params.id);

    return reply.success(data, {
      message: 'User details loaded successfully.',
    });
  });

  app.put('/admin/users/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = userIdParamsSchema.parse(request.params);
    const body = updateUserBodySchema.parse(request.body);
    const data = await app.services.adminUsers.updateUser(auth.actor, params.id, body);

    return reply.success(data, {
      message: 'User updated successfully.',
    });
  });

  app.delete('/admin/users/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = userIdParamsSchema.parse(request.params);
    const data = await app.services.adminUsers.deleteUser(auth.actor, params.id);

    return reply.success(data, {
      message: 'User deleted successfully.',
    });
  });
};
