import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import { createRateLimitPreHandler } from '../lib/rate-limit.js';
import {
  activateInviteBodySchema,
  inviteTokenParamsSchema,
  loginBodySchema,
  passwordUpdateBodySchema,
  profileUpdateBodySchema,
  refreshBodySchema,
  tenantSlugParamsSchema,
} from '../schemas/auth.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  const loginRateLimit = createRateLimitPreHandler({
    namespace: 'auth-login',
    maxRequests: 10,
    windowMs: 60_000,
  });
  const refreshRateLimit = createRateLimitPreHandler({
    namespace: 'auth-refresh',
    maxRequests: 20,
    windowMs: 60_000,
  });
  const inviteLookupRateLimit = createRateLimitPreHandler({
    namespace: 'auth-invite-lookup',
    maxRequests: 30,
    windowMs: 60_000,
  });
  const inviteActivationRateLimit = createRateLimitPreHandler({
    namespace: 'auth-invite-activation',
    maxRequests: 10,
    windowMs: 60_000,
  });

  app.post('/auth/login', { preHandler: loginRateLimit }, async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const data = await app.services.auth.login({
      identifier: body.identifier,
      password: body.password,
      companySlug: body.company_slug,
    });

    return reply.success(data, {
      message: 'Login completed successfully.',
    });
  });

  app.post('/auth/refresh', { preHandler: refreshRateLimit }, async (request, reply) => {
    const body = refreshBodySchema.parse(request.body);
    const data = await app.services.auth.refresh(body);

    return reply.success(data, {
      message: 'Session refreshed successfully.',
    });
  });

  app.post('/auth/logout', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.auth.logout(auth.actor);

    return reply.success(data, {
      message: 'Session invalidated successfully.',
    });
  });

  app.get('/auth/me', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.auth.getMe(auth.actor);

    return reply.success(data, {
      message: 'Authenticated profile loaded successfully.',
    });
  });

  app.get('/auth/tenant/:slug', async (request, reply) => {
    const params = tenantSlugParamsSchema.parse(request.params);
    const data = await app.services.auth.getTenantBranding(params.slug);

    return reply.success(data, {
      message: 'Tenant branding loaded successfully.',
    });
  });

  app.get('/auth/invites/:token', { preHandler: inviteLookupRateLimit }, async (request, reply) => {
    const params = inviteTokenParamsSchema.parse(request.params);
    const data = await app.services.auth.getInviteByToken(params.token);

    return reply.success(data, {
      message: 'Invite validated successfully.',
    });
  });

  app.post('/auth/invites/activate', { preHandler: inviteActivationRateLimit }, async (request, reply) => {
    const body = activateInviteBodySchema.parse(request.body);
    const data = await app.services.auth.activateInvite(body);

    return reply.success(data, {
      statusCode: 201,
      message: 'Invite activated successfully.',
    });
  });

  app.patch('/auth/profile', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = profileUpdateBodySchema.parse(request.body);
    const data = await app.services.auth.updateProfile(auth.actor, body);

    return reply.success(data, {
      message: 'Profile updated successfully.',
    });
  });

  app.patch('/auth/password', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = passwordUpdateBodySchema.parse(request.body);
    const data = await app.services.auth.updatePassword(auth.actor, body);

    return reply.success(data, {
      message: 'Password updated successfully.',
    });
  });
};
