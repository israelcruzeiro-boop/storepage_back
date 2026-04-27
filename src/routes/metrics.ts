import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  recordRatingBodySchema,
  recordViewBodySchema,
  repositoryMetricsQuerySchema,
  userActivityParamsSchema,
} from '../schemas/content.js';

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/metrics/views', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = recordViewBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.recordView(auth.actor, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Content view recorded successfully.',
    });
  });

  app.post('/metrics/ratings', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = recordRatingBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.recordRating(auth.actor, body);

    return reply.success(data, {
      message: 'Content rating recorded successfully.',
    });
  });

  app.get('/admin/metrics/repositories', async (request, reply) => {
    const auth = requireAdminRole(request);
    const query = repositoryMetricsQuerySchema.parse(request.query);
    if (!query.repositoryId) {
      const data = await app.services.contentLibrary.getSummary(auth.actor.companyId);
      return reply.success(data, {
        message: 'Repository metrics summary loaded successfully.',
      });
    }
    const data = await app.services.contentLibrary.getRepositoryMetrics(auth.actor.companyId, query.repositoryId);

    return reply.success(data, {
      message: 'Repository metrics loaded successfully.',
    });
  });

  app.get('/admin/metrics/views', async (request, reply) => {
    const auth = requireAdminRole(request);
    const query = repositoryMetricsQuerySchema.parse(request.query);
    const data = await app.services.contentLibrary.listViews(auth.actor.companyId, query);

    return reply.success(data, {
      message: 'Content views loaded successfully.',
    });
  });

  app.get('/admin/metrics/ratings', async (request, reply) => {
    const auth = requireAdminRole(request);
    const query = repositoryMetricsQuerySchema.parse(request.query);
    const data = await app.services.contentLibrary.listRatings(auth.actor.companyId, query);

    return reply.success(data, {
      message: 'Content ratings loaded successfully.',
    });
  });

  app.get('/admin/metrics/users/:id/activity', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = userActivityParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.listViews(auth.actor.companyId, { userId: params.id });

    return reply.success(data, {
      message: 'User activity loaded successfully.',
    });
  });

  app.get('/admin/metrics/summary', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.contentLibrary.getSummary(auth.actor.companyId);

    return reply.success(data, {
      message: 'Metrics summary loaded successfully.',
    });
  });
};
