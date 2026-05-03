import type { IncomingMessage, ServerResponse } from 'node:http';
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

type VercelAppInstance = {
  ready: () => PromiseLike<unknown>;
  server: {
    emit: (event: 'request', request: IncomingMessage, response: ServerResponse) => boolean;
  };
};

let vercelApp: VercelAppInstance | undefined;
let vercelAppReady: Promise<void> | undefined;

async function getVercelApp(): Promise<VercelAppInstance> {
  if (!vercelApp) {
    vercelApp = buildApp();
    vercelAppReady = Promise.resolve(vercelApp.ready()).then(() => undefined);
  }

  await vercelAppReady;
  return vercelApp;
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const app = await getVercelApp();
  app.server.emit('request', request, response);
}
