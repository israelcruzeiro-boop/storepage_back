import type { FastifyPluginAsync } from 'fastify';
import { landingSlugParamsSchema, repositoryIdParamsSchema } from '../schemas/content.js';

export const landingRoutes: FastifyPluginAsync = async (app) => {
  app.get('/landing/:slug', async (request, reply) => {
    const params = landingSlugParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.getLanding(params.slug);

    return reply.success(data, {
      message: 'Landing data loaded successfully.',
    });
  });

  app.get('/landing/:slug/repositories', async (request, reply) => {
    const params = landingSlugParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.listPublicRepositories(params.slug);

    return reply.success(data, {
      message: 'Public repositories loaded successfully.',
    });
  });

  app.get('/landing/repositories/:id/contents', async (request, reply) => {
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.listPublicContents(params.id);

    return reply.success(data, {
      message: 'Public contents loaded successfully.',
    });
  });

  app.get('/landing/repositories/:id/simple-links', async (request, reply) => {
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.listPublicSimpleLinks(params.id);

    return reply.success(data, {
      message: 'Public simple links loaded successfully.',
    });
  });
};
