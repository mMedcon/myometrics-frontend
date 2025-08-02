// API configuration and error handling utilities
export { authService } from './auth';
export { microserviceAPI } from './microservice';
export { djangoAPI } from './django';

// Import for internal use
import { authService } from './auth';

// Types
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from './auth';

export type {
  UploadResponse,
  UploadDetails,
  UserUpload,
  Stats,
} from './microservice';

export type {
  AuditLog,
  UserActivity,
  AnalyticsData,
  NotificationSettings,
} from './django';

// API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Interceptor for handling token refresh
export async function apiCall<T>(
  apiFunction: () => Promise<T>,
  retryOnAuthError = true
): Promise<T> {
  try {
    return await apiFunction();
  } catch (error: any) {
    if (retryOnAuthError && error.status === 401) {
      try {
        await authService.refreshToken();
        return await apiFunction();
      } catch (refreshError) {
        // Refresh failed, redirect to login
        authService.logout();
        window.location.href = '/auth';
        throw refreshError;
      }
    }
    throw error;
  }
}

// Request timeout utility
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}
