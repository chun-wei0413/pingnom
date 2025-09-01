import { apiClient } from './apiClient';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserSearchResult,
} from '@/types/user';
import { ApiResponse, SearchQuery } from '@/types/api';

export class UserApi {
  // Authentication
  public async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/users/register', data);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Registration failed');
  }

  public async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    if (response.data) {
      // Store token after successful login
      apiClient.setAccessToken(response.data.accessToken);
      return response.data;
    }
    throw new Error(response.error || 'Login failed');
  }

  public async logout(): Promise<void> {
    // Clear token
    apiClient.setAccessToken(null);
    // Note: Logout endpoint not yet implemented in backend
    // await apiClient.post('/auth/logout');
  }

  // Profile management
  public async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile');
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch profile');
  }

  public async updateProfile(data: UpdateProfileRequest): Promise<void> {
    const response = await apiClient.put('/users/profile', data);
    if (response.error) {
      throw new Error(response.error);
    }
  }

  public async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.put('/users/password', data);
    if (response.error) {
      throw new Error(response.error);
    }
  }

  public async updatePreferences(data: {
    cuisineTypes: string[];
    restrictions: string[];
    minPrice: number;
    maxPrice: number;
  }): Promise<void> {
    const response = await apiClient.put('/users/preferences', data);
    if (response.error) {
      throw new Error(response.error);
    }
  }

  public async updatePrivacy(data: {
    isDiscoverable: boolean;
    showLocation: boolean;
    allowFriendRequest: boolean;
  }): Promise<void> {
    const response = await apiClient.put('/users/privacy', data);
    if (response.error) {
      throw new Error(response.error);
    }
  }

  // User discovery
  public async searchUsers(query: SearchQuery): Promise<{ users: UserSearchResult[]; total: number }> {
    const params = {
      q: query.query || '',
      limit: query.limit || 20,
      offset: query.offset || 0,
    };

    const response = await apiClient.get<{ users: UserSearchResult[]; total: number }>('/users/search', params);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to search users');
  }

  // Utility methods
  public async checkHealth(): Promise<boolean> {
    try {
      await apiClient.healthCheck();
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const userApi = new UserApi();
export default userApi;