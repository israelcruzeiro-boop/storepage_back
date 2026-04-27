import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  contentIdParamsSchema,
  createContentBodySchema,
  createSimpleLinkBodySchema,
  simpleLinkIdParamsSchema,
  simpleLinkListQuerySchema,
  updateContentBodySchema,
  updateSimpleLinkBodySchema,
} from '../schemas/content.js';

export const contentsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/contents/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = contentIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.getContent(auth.actor, params.id);

    return reply.success(data, {
      message: 'Content loaded successfully.',
    });
  });

  app.get('/simple-links', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = simpleLinkListQuerySchema.parse(request.query);
    const data = await app.services.contentLibrary.listSimpleLinks(auth.actor, query.repositoryId);

    return reply.success(data, {
      message: 'Simple links loaded successfully.',
    });
  });

  app.post('/admin/contents', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createContentBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.createContent(auth.actor.companyId, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Content created successfully.',
    });
  });

  app.put('/admin/contents/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = contentIdParamsSchema.parse(request.params);
    const body = updateContentBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.updateContent(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      message: 'Content updated successfully.',
    });
  });

  app.delete('/admin/contents/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = contentIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.deleteContent(auth.actor.companyId, params.id);

    return reply.success(data, {
      message: 'Content deleted successfully.',
    });
  });

  app.post('/admin/simple-links', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createSimpleLinkBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.createSimpleLink(auth.actor.companyId, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Simple link created successfully.',
    });
  });

  app.put('/admin/simple-links/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = simpleLinkIdParamsSchema.parse(request.params);
    const body = updateSimpleLinkBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.updateSimpleLink(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      message: 'Simple link updated successfully.',
    });
  });

  app.delete('/admin/simple-links/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = simpleLinkIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.deleteSimpleLink(auth.actor.companyId, params.id);

    return reply.success(data, {
      message: 'Simple link deleted successfully.',
    });
  });
};
