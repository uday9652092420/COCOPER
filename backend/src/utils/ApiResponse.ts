export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: unknown;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: 'success',
    data,
    message,
  };
}

export function errorResponse(message: string, errors?: unknown): ApiResponse {
  return {
    status: 'error',
    message,
    errors,
  };
}
