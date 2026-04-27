import type { FastifyPluginAsync } from 'fastify';
import { apiRoutes } from './api.js';
import { rootRoutes } from './root.js';

export const registerRoutes: FastifyPluginAsync = async (app) => {
  await app.register(rootRoutes);
  await app.register(apiRoutes, { prefix: app.config.API_PREFIX });
};
