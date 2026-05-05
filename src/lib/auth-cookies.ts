import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppEnv } from '../config/env.js';

export const REFRESH_TOKEN_COOKIE_NAME = 'storepage_refresh';
export const INVITE_ACTIVATION_COOKIE_NAME = 'storepage_invite_activation';
const INVITE_ACTIVATION_TTL_SECONDS = 15 * 60;

function buildRefreshCookiePath(env: AppEnv): string {
  return `${env.API_PREFIX}/auth`;
}

function buildInviteActivationCookiePath(env: AppEnv): string {
  return `${env.API_PREFIX}/auth/invites`;
}

function formatSameSiteAttribute(sameSite: AppEnv['AUTH']['cookieSameSite']): string {
  switch (sameSite) {
    case 'none':
      return 'SameSite=None';
    case 'strict':
      return 'SameSite=Strict';
    case 'lax':
    default:
      return 'SameSite=Lax';
  }
}

function buildCookieAttributes(env: AppEnv, maxAgeSeconds: number, expiresAt: Date, path: string): string[] {
  const attributes = [
    'HttpOnly',
    formatSameSiteAttribute(env.AUTH.cookieSameSite),
    `Path=${path}`,
    `Max-Age=${maxAgeSeconds}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (env.NODE_ENV === 'production' || env.AUTH.cookieSameSite === 'none') {
    attributes.push('Secure');
  }

  return attributes;
}

function appendSetCookieHeader(reply: FastifyReply, cookie: string): void {
  const existing = reply.getHeader('Set-Cookie');
  if (!existing) {
    reply.header('Set-Cookie', cookie);
    return;
  }

  const cookies = Array.isArray(existing) ? existing.map(String) : [String(existing)];
  reply.header('Set-Cookie', [...cookies, cookie]);
}

function getCookieValue(request: FastifyRequest, cookieName: string): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookiePart of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = cookiePart.split('=');
    if (rawName.trim() !== cookieName) continue;

    const rawValue = rawValueParts.join('=');
    if (!rawValue) return null;

    return decodeURIComponent(rawValue);
  }

  return null;
}

export function setRefreshTokenCookie(
  reply: FastifyReply,
  env: AppEnv,
  refreshToken: string,
  refreshTokenExpiresAt: string,
): void {
  const expiresAt = new Date(refreshTokenExpiresAt);
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const encodedValue = encodeURIComponent(refreshToken);
  const cookie = [
    `${REFRESH_TOKEN_COOKIE_NAME}=${encodedValue}`,
    ...buildCookieAttributes(env, maxAgeSeconds, expiresAt, buildRefreshCookiePath(env)),
  ].join('; ');

  appendSetCookieHeader(reply, cookie);
}

export function clearRefreshTokenCookie(reply: FastifyReply, env: AppEnv): void {
  const cookie = [
    `${REFRESH_TOKEN_COOKIE_NAME}=`,
    ...buildCookieAttributes(env, 0, new Date(0), buildRefreshCookiePath(env)),
  ].join('; ');

  appendSetCookieHeader(reply, cookie);
}

export function getRefreshTokenFromCookie(request: FastifyRequest): string | null {
  return getCookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
}

export function setInviteActivationCookie(reply: FastifyReply, env: AppEnv, inviteToken: string): void {
  const expiresAt = new Date(Date.now() + INVITE_ACTIVATION_TTL_SECONDS * 1000);
  const encodedValue = encodeURIComponent(inviteToken);
  const cookie = [
    `${INVITE_ACTIVATION_COOKIE_NAME}=${encodedValue}`,
    ...buildCookieAttributes(env, INVITE_ACTIVATION_TTL_SECONDS, expiresAt, buildInviteActivationCookiePath(env)),
  ].join('; ');

  appendSetCookieHeader(reply, cookie);
}

export function clearInviteActivationCookie(reply: FastifyReply, env: AppEnv): void {
  const cookie = [
    `${INVITE_ACTIVATION_COOKIE_NAME}=`,
    ...buildCookieAttributes(env, 0, new Date(0), buildInviteActivationCookiePath(env)),
  ].join('; ');

  appendSetCookieHeader(reply, cookie);
}

export function getInviteActivationTokenFromCookie(request: FastifyRequest): string | null {
  return getCookieValue(request, INVITE_ACTIVATION_COOKIE_NAME);
}

export function removeRefreshTokenFromPayload<T extends { refreshToken: string; refreshTokenExpiresAt: string }>(
  payload: T,
): Omit<T, 'refreshToken' | 'refreshTokenExpiresAt'> {
  const clone = { ...payload };
  delete (clone as { refreshToken?: string }).refreshToken;
  delete (clone as { refreshTokenExpiresAt?: string }).refreshTokenExpiresAt;
  return clone;
}
