import type { FastifyPluginAsync } from 'fastify';

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

export const securityHeadersPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (_request, reply) => {
    Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
      reply.header(header, value);
    });

    if (app.config.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
  });
};
