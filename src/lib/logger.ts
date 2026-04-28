import type { FastifyServerOptions } from 'fastify';
import type { AppEnv } from '../config/env.js';

const REDACTED = '[REDACTED]';
const SENSITIVE_QUERY_KEYS = new Set(['token', 'activationToken', 'inviteToken']);

function redactSensitiveUrl(rawUrl: string): string {
  const redactedPath = rawUrl.replace(
    /(\/auth\/invites\/)([A-Za-z0-9_-]{20,})(?=$|[/?#])/g,
    `$1${REDACTED}`,
  );

  try {
    const url = new URL(redactedPath, 'http://storepage.local');
    let changed = false;
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, REDACTED);
        changed = true;
      }
    }

    return changed ? `${url.pathname}${url.search}${url.hash}` : redactedPath;
  } catch {
    return redactedPath;
  }
}

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
        'req.params.token',
        'req.query.token',
        'req.query.activationToken',
        'req.query.inviteToken',
        'req.body.refreshToken',
        'res.headers["set-cookie"]',
        'response.headers["set-cookie"]',
      ],
      censor: REDACTED,
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: redactSensitiveUrl(request.url),
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
