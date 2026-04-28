import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  clearRefreshTokenCookie,
  clearInviteActivationCookie,
  getInviteActivationTokenFromCookie,
  getRefreshTokenFromCookie,
  removeRefreshTokenFromPayload,
  setInviteActivationCookie,
  setRefreshTokenCookie,
} from '../lib/auth-cookies.js';
import { AppError } from '../lib/errors.js';
import { createRateLimitPreHandler } from '../lib/rate-limit.js';
import {
  activateInviteBodySchema,
  inviteTokenParamsSchema,
  inviteSessionBodySchema,
  loginBodySchema,
  passwordUpdateBodySchema,
  profileUpdateBodySchema,
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
    setRefreshTokenCookie(reply, app.config, data.refreshToken, data.refreshTokenExpiresAt);

    return reply.success(removeRefreshTokenFromPayload(data), {
      message: 'Login completed successfully.',
    });
  });

  app.post('/auth/refresh', { preHandler: refreshRateLimit }, async (request, reply) => {
    const refreshToken = getRefreshTokenFromCookie(request);
    if (!refreshToken) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.');
    }

    const data = await app.services.auth.refresh({ refreshToken });
    setRefreshTokenCookie(reply, app.config, data.refreshToken, data.refreshTokenExpiresAt);

    return reply.success(removeRefreshTokenFromPayload(data), {
      message: 'Session refreshed successfully.',
    });
  });

  app.post('/auth/logout', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.auth.logout(auth.actor);
    clearRefreshTokenCookie(reply, app.config);

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
    const data = await app.services.auth.createInviteActivationSession(params.token);
    setInviteActivationCookie(reply, app.config, params.token);

    return reply.success(data, {
      message: 'Invite validated successfully.',
    });
  });

  app.post('/auth/invites/session', { preHandler: inviteLookupRateLimit }, async (request, reply) => {
    const body = inviteSessionBodySchema.parse(request.body);
    const data = await app.services.auth.createInviteActivationSession(body.token);
    setInviteActivationCookie(reply, app.config, body.token);

    return reply.success(data, {
      message: 'Invite activation session created successfully.',
    });
  });

  app.post('/auth/invites/activate', { preHandler: inviteActivationRateLimit }, async (request, reply) => {
    const body = activateInviteBodySchema.parse(request.body);
    const inviteToken = getInviteActivationTokenFromCookie(request);
    if (!inviteToken) {
      throw new AppError(401, 'INVITE_INVALID', 'Invite activation session is missing or expired.');
    }

    const data = await app.services.auth.activateInvite(inviteToken, body);
    clearInviteActivationCookie(reply, app.config);
    setRefreshTokenCookie(reply, app.config, data.refreshToken, data.refreshTokenExpiresAt);

    return reply.success(removeRefreshTokenFromPayload(data), {
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
