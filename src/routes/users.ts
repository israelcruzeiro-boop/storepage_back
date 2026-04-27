import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import { selfProfileUpdateBodySchema } from '../schemas/users.js';

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.patch('/users/me/profile', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = selfProfileUpdateBodySchema.parse(request.body);
    const data = await app.services.auth.updateOwnProfile(auth.actor, body);

    return reply.success(data, {
      message: 'Own profile updated successfully.',
    });
  });
};
