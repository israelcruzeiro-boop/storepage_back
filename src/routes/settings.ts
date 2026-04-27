import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  publicCompanyParamsSchema,
  updateAppearanceBodySchema,
  updateFeaturesBodySchema,
  updateGeneralBodySchema,
} from '../schemas/companies.js';

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/settings/appearance/:slug', async (request, reply) => {
    const params = publicCompanyParamsSchema.parse(request.params);
    const data = await app.services.company.getPublicAppearance(params.slug);

    return reply.success(data, {
      message: 'Public appearance settings loaded successfully.',
    });
  });

  app.get('/settings/features', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.company.getFeatureFlags(auth.actor.companyId);

    return reply.success(data, {
      message: 'Feature flags loaded successfully.',
    });
  });

  app.patch('/admin/settings/appearance', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = updateAppearanceBodySchema.parse(request.body);
    const data = await app.services.company.updateAppearance(auth.actor.companyId, body);

    return reply.success(data, {
      message: 'Appearance settings updated successfully.',
    });
  });

  app.patch('/admin/settings/features', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = updateFeaturesBodySchema.parse(request.body);
    const data = await app.services.company.updateFeatures(auth.actor.companyId, body);

    return reply.success(data, {
      message: 'Feature flags updated successfully.',
    });
  });

  app.patch('/admin/settings/general', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = updateGeneralBodySchema.parse(request.body);
    const data = await app.services.company.updateGeneral(auth.actor.companyId, body);

    return reply.success(data, {
      message: 'General company settings updated successfully.',
    });
  });
};
