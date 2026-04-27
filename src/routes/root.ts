import type { FastifyPluginAsync } from 'fastify';

export const rootRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_request, reply) =>
    reply.success(app.services.system.getRootInfo(), {
      message: 'StorePage_back foundation is running.',
    }),
  );

  app.get('/health', async (_request, reply) =>
    reply.success(app.services.system.getHealthReport(), {
      message: 'Health check completed successfully.',
    }),
  );

  app.get('/readyz', async (_request, reply) =>
    reply.success(app.services.system.getReadinessReport(), {
      message: 'Readiness check completed successfully.',
    }),
  );
};
