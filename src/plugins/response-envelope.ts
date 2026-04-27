import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { buildSuccessResponse } from '../lib/http.js';
import type { ReplySuccessOptions } from '../types/api.js';

function success<T>(this: FastifyReply, data: T, options: ReplySuccessOptions = {}): FastifyReply {
  const statusCode = options.statusCode ?? 200;
  const message = options.message ?? 'OK';

  return this.status(statusCode).send(buildSuccessResponse(data, message));
}

export const responseEnvelopePlugin: FastifyPluginAsync = async (app) => {
  app.decorateReply('success', success);
};
