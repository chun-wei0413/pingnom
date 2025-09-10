import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 服務類別
export class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://192.168.1.4:8090/api/v1', // 維持局域網 IP 給手機使用
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 初始化時預先載入 token
    this.initializeToken();

    // 請求攔截器 - 添加 JWT token
    this.api.interceptors.request.use(async (config) => {
      try {
        // 從 AsyncStorage 獲取 token
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Request:', config.method?.toUpperCase(), config.url, 'with token:', token.substring(0, 20) + '...');
        } else {
          console.log('API Request:', config.method?.toUpperCase(), config.url, 'NO TOKEN');
        }
      } catch (error) {
        console.error('Error in request interceptor:', error);
      }
      return config;
    }, (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    });

    // 回應攔截器 - 處理錯誤
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('API Error 401: Unauthorized, clearing token');
          await this.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // 初始化時載入 token
  private async initializeToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        this.authToken = token;
        console.log('Token loaded from AsyncStorage on initialization:', token.substring(0, 20) + '...');
      } else {
        console.log('No token found in AsyncStorage on initialization');
      }
    } catch (error) {
      console.error('Error loading token on initialization:', error);
    }
  }

  // 提供基本的 HTTP 方法
  async get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }

  // 認證相關方法
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.post('/auth/login', { email, password });
    // 適配後端回應格式到前端期待的格式
    const backendData = response.data.data;
    const token = backendData.accessToken;
    
    console.log('Login successful, received token:', token.substring(0, 20) + '...');
    
    // 立即設置 token 到實例中
    this.authToken = token;
    
    // 同時儲存到 AsyncStorage
    try {
      await AsyncStorage.setItem('token', token);
      console.log('Token saved to memory and AsyncStorage');
    } catch (error) {
      console.error('Error saving token to AsyncStorage:', error);
    }
    
    return {
      token: token,
      user: {
        id: this.parseUserIdFromToken(token),
        email: email, // 使用輸入的 email
        display_name: backendData.user.displayName,
        created_at: new Date().toISOString(),
      }
    };
  }

  // 從 JWT token 解析 user ID
  private parseUserIdFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.sub || '';
    } catch (error) {
      console.error('Failed to parse token:', error);
      return '';
    }
  }

  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const response = await this.post('/users/register', { 
      email, 
      password, 
      display_name: displayName 
    });
    return response.data;
  }

  // 用戶個人資料管理方法
  async updateProfile(profileData: {
    display_name?: string;
    email?: string;
  }) {
    try {
      const response = await this.put('/users/profile', profileData);
      console.log('Update profile API response:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Profile updated successfully'
      };
    } catch (error: any) {
      console.error('Update profile API error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to update profile'
      };
    }
  }

  async getUserProfile() {
    try {
      const response = await this.get('/users/profile');
      console.log('Get user profile API response:', response.data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Get user profile API error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to get user profile'
      };
    }
  }

  async updatePreferences(preferencesData: {
    cuisineTypes?: string[];
    restrictions?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) {
    try {
      const response = await this.put('/users/preferences', preferencesData);
      console.log('Update preferences API response:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Preferences updated successfully'
      };
    } catch (error: any) {
      console.error('Update preferences API error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to update preferences'
      };
    }
  }

  async updatePrivacy(privacyData: {
    isDiscoverable?: boolean;
    showLocation?: boolean;
    allowFriendRequest?: boolean;
  }) {
    try {
      const response = await this.put('/users/privacy', privacyData);
      console.log('Update privacy API response:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Privacy settings updated successfully'
      };
    } catch (error: any) {
      console.error('Update privacy API error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to update privacy settings'
      };
    }
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    try {
      const response = await this.put('/users/password', passwordData);
      console.log('Change password API response:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Password changed successfully'
      };
    } catch (error: any) {
      console.error('Change password API error:', error.response?.data || error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to change password'
      };
    }
  }

  // Ping 相關方法
  async getPings(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `/pings/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.get(url);
    return response.data;
  }

  async createPing(pingData: {
    title: string;
    description?: string;
    pingType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    scheduledAt: string; // ISO format
    invitees: string[]; // Array of user IDs
  }) {
    const response = await this.post('/pings', pingData);
    return response.data;
  }

  async respondToPing(pingId: string, responseData: {
    status: 'accepted' | 'declined';
    message?: string;
  }) {
    const response = await this.put(`/pings/${pingId}/respond`, responseData);
    return response.data;
  }

  // 朋友相關方法
  async getFriends() {
    try {
      const response = await this.get('/friends/');
      console.log('getFriends response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getFriends error:', error);
      throw error;
    }
  }

  async getPendingRequests() {
    const response = await this.get('/friends/requests/pending');
    return response.data;
  }

  async getSentRequests() {
    const response = await this.get('/friends/requests/sent');
    return response.data;
  }

  async searchUsers(email: string) {
    const response = await this.get(`/users/search?email=${encodeURIComponent(email)}`);
    return response.data;
  }

  async sendFriendRequest(addresseeId: string, message?: string) {
    const response = await this.post('/friends/request', { 
      addresseeId,
      message: message || ''
    });
    return response.data;
  }

  async acceptFriendRequest(requestId: string) {
    const response = await this.put(`/friends/request/${requestId}/accept`);
    return response.data;
  }

  async declineFriendRequest(requestId: string) {
    const response = await this.put(`/friends/request/${requestId}/decline`);
    return response.data;
  }

  // Dashboard 統計方法
  async getDashboardStats() {
    const response = await this.get('/dashboard/stats');
    return response.data;
  }

  // 餐廳搜尋方法
  async searchRestaurants(params: {
    lat?: number;
    lon?: number;
    radius?: number;
    limit?: number;
    offset?: number;
    minRating?: number;
    cuisineTypes?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params.lat) queryParams.append('lat', params.lat.toString());
    if (params.lon) queryParams.append('lon', params.lon.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params.cuisineTypes) queryParams.append('cuisineTypes', params.cuisineTypes);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await this.get(`/restaurants/?${queryParams.toString()}`);
    return response.data;
  }

  // 餐廳推薦方法
  async getRestaurantRecommendations(data: {
    participantLocations: Array<{ latitude: number; longitude: number }>;
    cuisinePreferences?: string[];
    priceRange?: { min: number; max: number };
    dietaryRestrictions?: string[];
    maxDistance?: number;
    maxResults?: number;
  }) {
    const response = await this.post('/restaurants/recommendations', data);
    return response.data;
  }

  // 根據 ID 獲取餐廳詳情
  async getRestaurantById(id: string) {
    const response = await this.get(`/restaurants/${id}`);
    return response.data;
  }

  // 帳單相關方法
  async createBill(data: { title: string; description?: string }) {
    const response = await this.post('/bills', data);
    return response.data;
  }

  async getBill(billId: string) {
    const response = await this.get(`/bills/${billId}`);
    return response.data;
  }

  async getUserBills(filter?: string) {
    const queryString = filter ? `?filter=${filter}` : '';
    const response = await this.get(`/bills${queryString}`);
    return response.data;
  }

  async addBillItem(billId: string, data: {
    name: string;
    amount: number;
    description?: string;
    payerIds: string[];
  }) {
    const response = await this.post(`/bills/${billId}/items`, data);
    return response.data;
  }

  async addBillParticipant(billId: string, data: {
    userId: string;
    displayName: string;
  }) {
    const response = await this.post(`/bills/${billId}/participants`, data);
    return response.data;
  }

  async markBillPaid(billId: string, data: {
    userId: string;
    amount: number;
  }) {
    const response = await this.put(`/bills/${billId}/payments`, data);
    return response.data;
  }

  // Token 管理方法
  async getAuthToken(): Promise<string | null> {
    // 優先使用記憶體中的 token
    if (this.authToken) {
      console.log('Using token from memory:', this.authToken.substring(0, 20) + '...');
      return this.authToken;
    }
    
    // 從 AsyncStorage 獲取 token
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token from AsyncStorage:', token ? token.substring(0, 20) + '...' : 'null');
      if (token) {
        this.authToken = token; // 快取到記憶體
        return token;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    console.log('No token available - user needs to login');
    return null;
  }

  async clearAuthToken() {
    this.authToken = null;
    try {
      await AsyncStorage.removeItem('token');
      console.log('Token cleared from memory and AsyncStorage');
    } catch (error) {
      console.error('Error clearing token from AsyncStorage:', error);
    }
  }
}

// 創建並導出 API 服務實例
export const api = new ApiService();
export default api;