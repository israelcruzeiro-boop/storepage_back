export interface ReplySuccessOptions {
  message?: string;
  statusCode?: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
}
