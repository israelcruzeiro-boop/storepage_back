import { buildApp } from './app.js';
import { getEnv } from './config/env.js';

async function start() {
  const env = getEnv();
  const app = buildApp(env);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      {
        host: env.HOST,
        port: env.PORT,
        apiPrefix: env.API_PREFIX,
      },
      'StorePage_back listening',
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
