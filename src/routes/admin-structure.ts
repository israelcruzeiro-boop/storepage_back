import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole } from '../lib/access-control.js';
import {
  createTopLevelBodySchema,
  createUnitBodySchema,
  structureEntityParamsSchema,
  updateTopLevelBodySchema,
  updateUnitBodySchema,
} from '../schemas/structure.js';

export const adminStructureRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/structure', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.organization.getStructure(auth.actor.companyId);

    return reply.success(data, {
      message: 'Organizational structure loaded successfully.',
    });
  });

  app.get('/admin/structure/top-levels', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.organization.listTopLevels(auth.actor.companyId);

    return reply.success(data, {
      message: 'Top-level nodes loaded successfully.',
    });
  });

  app.get('/admin/structure/units', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.organization.listUnits(auth.actor.companyId);

    return reply.success(data, {
      message: 'Organizational units loaded successfully.',
    });
  });

  app.post('/admin/structure/top-levels', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createTopLevelBodySchema.parse(request.body);
    const data = await app.services.organization.createTopLevel(auth.actor.companyId, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Top-level node created successfully.',
    });
  });

  app.put('/admin/structure/top-levels/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = structureEntityParamsSchema.parse(request.params);
    const body = updateTopLevelBodySchema.parse(request.body);
    const data = await app.services.organization.updateTopLevel(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      message: 'Top-level node updated successfully.',
    });
  });

  app.delete('/admin/structure/top-levels/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = structureEntityParamsSchema.parse(request.params);
    const data = await app.services.organization.deleteTopLevel(auth.actor.companyId, params.id);

    return reply.success(data, {
      message: 'Top-level node deleted successfully.',
    });
  });

  app.post('/admin/structure/units', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createUnitBodySchema.parse(request.body);
    const data = await app.services.organization.createUnit(auth.actor.companyId, body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Organizational unit created successfully.',
    });
  });

  app.put('/admin/structure/units/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = structureEntityParamsSchema.parse(request.params);
    const body = updateUnitBodySchema.parse(request.body);
    const data = await app.services.organization.updateUnit(auth.actor.companyId, params.id, body);

    return reply.success(data, {
      message: 'Organizational unit updated successfully.',
    });
  });

  app.delete('/admin/structure/units/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = structureEntityParamsSchema.parse(request.params);
    const data = await app.services.organization.deleteUnit(auth.actor.companyId, params.id);

    return reply.success(data, {
      message: 'Organizational unit deleted successfully.',
    });
  });
};
