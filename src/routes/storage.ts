import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import { storagePublicUrlQuerySchema, storageUploadBodySchema } from '../schemas/storage.js';

export const storageRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/storage/upload',
    {
      bodyLimit: Math.ceil(app.config.SUPABASE.storage.maxUploadBytes * 1.4) + 4096,
    },
    async (request, reply) => {
      const auth = requireAuthenticatedRequest(request);
      const body = storageUploadBodySchema.parse(request.body);
      const data = await app.services.storage.upload(auth.actor, body);

      return reply.success(data, {
        statusCode: 201,
        message: 'File uploaded successfully.',
      });
    },
  );

  app.get('/storage/public-url', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = storagePublicUrlQuerySchema.parse(request.query);
    const data = app.services.storage.getPublicUrl(auth.actor, query);

    return reply.success(data, {
      message: 'Storage public URL generated successfully.',
    });
  });
};
