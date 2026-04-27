import type { FastifyServerOptions } from 'fastify';
import type { AppEnv } from '../config/env.js';

export function buildLoggerConfig(env: AppEnv): FastifyServerOptions['logger'] {
  return {
    level: env.LOG_LEVEL,
    base: {
      service: 'storepage-back',
      environment: env.NODE_ENV,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.refreshToken',
        'response.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          host: request.host,
          remoteAddress: request.ip,
          requestId: request.id,
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
      err(error) {
        return {
          type: error.name,
          message: error.message,
          stack: env.NODE_ENV === 'development' ? error.stack ?? '' : '',
        };
      },
    },
  };
}
