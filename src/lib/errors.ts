import type { FastifyError } from 'fastify';
import { ZodError } from 'zod';
import type { AppEnv } from '../config/env.js';

export type AppErrorCode =
  | 'AUTH_CONFIGURATION_ERROR'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'CORS_ORIGIN_DENIED'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_AUTH_HEADER'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_PASSWORD'
  | 'INVALID_REFRESH_TOKEN'
  | 'INVALID_TOKEN'
  | 'INVITE_EXPIRED'
  | 'INVITE_INVALID'
  | 'INVITE_PENDING_ACTIVATION'
  | 'NOT_FOUND'
  | 'PASSWORD_POLICY_VIOLATION'
  | 'RATE_LIMITED'
  | 'RESOURCE_IN_USE'
  | 'ROLE_ESCALATION_FORBIDDEN'
  | 'SELF_MODIFICATION_FORBIDDEN'
  | 'SESSION_REVOKED'
  | 'STORAGE_UNAVAILABLE'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_ACCESS_DENIED'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'TOKEN_ISSUE_UNSUPPORTED'
  | 'UNAUTHENTICATED'
  | 'VALIDATION_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly details?: unknown;
  public readonly expose: boolean;

  public constructor(statusCode: number, code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.expose = statusCode < 500;
  }
}

export interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

function isFastifyError(error: unknown): error is FastifyError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function normalizeError(error: unknown, env: AppEnv): NormalizedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: error.flatten(),
    };
  }

  if (isFastifyError(error) && typeof error.statusCode === 'number' && error.statusCode >= 400) {
    return {
      statusCode: error.statusCode,
      code: error.code ?? 'BAD_REQUEST',
      message: error.message,
    };
  }

  const fallbackMessage =
    env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error.';

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: fallbackMessage,
  };
}
