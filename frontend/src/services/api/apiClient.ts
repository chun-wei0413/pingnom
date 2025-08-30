import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse, RequestConfig } from '@/types/api';

class ApiClient {
  private instance: AxiosInstance;
  private baseURL = 'http://localhost:8090/api/v1'; // Development URL with InMemory Database
  private accessToken: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available and required
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        
        console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
      (error) => {
        console.error('🔴 Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`🟢 API Response: ${response.status} ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error('🔴 Response Error:', error.response?.data || error.message);
        
        // Handle different error scenarios
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      return {
        error: error.response.data?.error || 'Server Error',
        details: error.response.data?.details,
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        error: 'Network Error',
        details: 'Unable to connect to server',
        status: 0,
      };
    } else {
      return {
        error: 'Request Error',
        details: error.message,
        status: -1,
      };
    }
  }

  private handleUnauthorized() {
    // Clear token and redirect to login
    this.setAccessToken(null);
    // TODO: Implement navigation to login screen
    console.log('🔴 Unauthorized: Redirecting to login');
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public setBaseURL(url: string) {
    this.baseURL = url;
    this.instance.defaults.baseURL = url;
  }

  // Generic request method
  public async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      url: config.headers?.url || '',
      headers: config.headers,
      params: config.params,
      data: config.data,
    };

    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.request(axiosConfig);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // Convenience methods
  public async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', headers: { url }, params });
  }

  public async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', headers: { url }, data });
  }

  public async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', headers: { url }, data });
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', headers: { url } });
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await this.instance.get('/health');
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;