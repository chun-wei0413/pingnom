// API response types

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  status: number;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface SearchQuery extends PaginationQuery {
  query?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  requireAuth?: boolean;
}