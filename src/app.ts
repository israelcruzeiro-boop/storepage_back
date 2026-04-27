import Fastify from 'fastify';
import { getEnv, type AppEnv } from './config/env.js';
import { buildAppContainer, type BuildAppContainerOptions } from './lib/app-container.js';
import { buildLoggerConfig } from './lib/logger.js';
import { registerBasePlugins } from './plugins/register-base-plugins.js';
import { registerRoutes } from './routes/index.js';

export type BuildAppOptions = BuildAppContainerOptions;

export function buildApp(env: AppEnv = getEnv(), options: BuildAppOptions = {}) {
  const container = buildAppContainer(env, options);
  const app = Fastify({
    logger: buildLoggerConfig(env),
    requestTimeout: env.REQUEST_TIMEOUT_MS,
    trustProxy: true,
  });

  app.decorate('config', env);
  app.decorate('repositories', container.repositories);
  app.decorate('services', container.services);

  void registerBasePlugins(app);
  void app.register(registerRoutes);

  return app;
}
