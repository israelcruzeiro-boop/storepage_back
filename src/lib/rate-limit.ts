import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './errors.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  namespace: string;
  maxRequests: number;
  windowMs: number;
}

export type RateLimitPreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

const buckets = new WeakMap<object, Map<string, RateLimitEntry>>();

function getRequestIp(request: FastifyRequest): string {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0]!.trim();
  }

  return request.ip;
}

export function createRateLimitPreHandler(options: RateLimitOptions): RateLimitPreHandler {
  return async (request) => {
    const now = Date.now();
    let store = buckets.get(request.server);

    if (!store) {
      store = new Map<string, RateLimitEntry>();
      buckets.set(request.server, store);
    }

    const key = `${options.namespace}:${getRequestIp(request)}`;
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return;
    }

    if (current.count >= options.maxRequests) {
      throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
    }

    current.count += 1;
  };
}
