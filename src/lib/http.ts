import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api.js';

export function buildSuccessResponse<T>(data: T, message = 'OK'): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function buildErrorResponse(error: string, code: string): ApiErrorResponse {
  return {
    success: false,
    error,
    code,
  };
}
