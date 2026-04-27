import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';

export const structureRoutes: FastifyPluginAsync = async (app) => {
  app.get('/structure', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.organization.getStructure(auth.actor.companyId);

    return reply.success(data, {
      message: 'Organizational structure loaded successfully.',
    });
  });

  app.get('/structure/top-levels', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.organization.listTopLevels(auth.actor.companyId);

    return reply.success(data, {
      message: 'Top-level nodes loaded successfully.',
    });
  });

  app.get('/structure/units', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.organization.listUnits(auth.actor.companyId);

    return reply.success(data, {
      message: 'Organizational units loaded successfully.',
    });
  });
};
