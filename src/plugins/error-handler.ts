import type { FastifyPluginAsync } from 'fastify';
import { normalizeError } from '../lib/errors.js';
import { buildErrorResponse } from '../lib/http.js';

export const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    const normalized = normalizeError(error, app.config);

    if (normalized.statusCode >= 500) {
      request.log.error(
        {
          err: error,
          code: normalized.code,
          details: normalized.details,
        },
        'Request failed with an internal error',
      );
    } else {
      request.log.warn(
        {
          code: normalized.code,
          details: normalized.details,
        },
        'Request rejected',
      );
    }

    if (reply.sent) {
      return;
    }

    void reply.status(normalized.statusCode).send(buildErrorResponse(normalized.message, normalized.code));
  });

  app.setNotFoundHandler((request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
      },
      'Route not found',
    );

    void reply.status(404).send(buildErrorResponse('Route not found.', 'NOT_FOUND'));
  });
};
