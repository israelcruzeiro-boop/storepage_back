import Fastify from 'fastify';
import { registerHealthRoutes } from './routes/health.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/', async () => {
    return {
      name: 'storepage-back',
      status: 'ok',
      message: 'Backend base ready for StorePage decoupling.',
    };
  });

  registerHealthRoutes(app);

  return app;
}
