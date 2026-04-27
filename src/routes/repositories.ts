import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  categoryIdParamsSchema,
  contentListQuerySchema,
  createCategoryBodySchema,
  createRepositoryBodySchema,
  repositoryIdParamsSchema,
  updateCategoryBodySchema,
  updateRepositoryBodySchema,
} from '../schemas/content.js';

export const repositoriesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/repositories', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.contentLibrary.listRepositories(auth.actor);

    return reply.success(data, {
      message: 'Repositories loaded successfully.',
    });
  });

  app.get('/repositories/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.getRepository(auth.actor, params.id);

    return reply.success(data, {
      message: 'Repository loaded successfully.',
    });
  });

  app.get('/repositories/:id/catalog', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.getCatalog(auth.actor, params.id);

    return reply.success(data, {
      message: 'Repository catalog loaded successfully.',
    });
  });

  app.get('/repositories/:id/categories', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.listCategories(auth.actor, params.id);

    return reply.success(data, {
      message: 'Repository categories loaded successfully.',
    });
  });

  app.get('/repositories/:id/simple-links', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.listSimpleLinks(auth.actor, params.id);

    return reply.success(data, {
      message: 'Repository simple links loaded successfully.',
    });
  });

  app.get('/contents', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = contentListQuerySchema.parse(request.query);
    const data = await app.services.contentLibrary.listContents(auth.actor, query.repositoryId);

    return reply.success(data, {
      message: 'Contents loaded successfully.',
    });
  });

  app.post('/admin/repositories', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createRepositoryBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.createRepository(auth.actor.companyId, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Repository created successfully.',
    });
  });

  app.put('/admin/repositories/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const body = updateRepositoryBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.updateRepository(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      message: 'Repository updated successfully.',
    });
  });

  app.delete('/admin/repositories/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.deleteRepository(auth.actor.companyId, params.id);

    return reply.success(data, {
      message: 'Repository deleted successfully.',
    });
  });

  app.post('/admin/repositories/:id/categories', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = repositoryIdParamsSchema.parse(request.params);
    const body = createCategoryBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.createCategory(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Category created successfully.',
    });
  });

  app.put('/admin/categories/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = categoryIdParamsSchema.parse(request.params);
    const body = updateCategoryBodySchema.parse(request.body);
    const data = await app.services.contentLibrary.updateCategory(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      message: 'Category updated successfully.',
    });
  });

  app.delete('/admin/categories/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = categoryIdParamsSchema.parse(request.params);
    const data = await app.services.contentLibrary.deleteCategory(auth.actor.companyId, params.id);

    return reply.success(data, {
      message: 'Category deleted successfully.',
    });
  });
};
