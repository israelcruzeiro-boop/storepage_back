import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import { companiesListQuerySchema, publicCompanyParamsSchema } from '../schemas/companies.js';

export const companiesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/companies', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = companiesListQuerySchema.parse(request.query);
    const data = await app.services.company.listForActor(auth.actor, query.includeDeleted);

    return reply.success(data, {
      message: 'Companies loaded successfully.',
    });
  });

  app.get('/companies/current', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.company.getCurrentCompany(auth.actor.companyId);

    return reply.success(data, {
      message: 'Current company loaded successfully.',
    });
  });

  app.get('/companies/public/:slug', async (request, reply) => {
    const params = publicCompanyParamsSchema.parse(request.params);
    const data = await app.services.company.getPublicCompany(params.slug);

    return reply.success(data, {
      message: 'Public company configuration loaded successfully.',
    });
  });
};
