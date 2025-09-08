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
      baseURL: 'http://192.168.1.4:8090/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 初始化時預先載入 token
    this.initializeToken();

    // 請求攔截器 - 添加 JWT token
    this.api.interceptors.request.use(async (config) => {
      // 從 AsyncStorage 獲取 token
      const token = await this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API Request:', config.method?.toUpperCase(), config.url, 'with token:', token.substring(0, 20) + '...');
      } else {
        console.log('API Request:', config.method?.toUpperCase(), config.url, 'NO TOKEN');
      }
      return config;
    });

    // 回應攔截器 - 處理錯誤
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('API Error 401: Unauthorized, clearing token');
          this.clearAuthToken();
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
    
    // 設置 token 到實例中和 AsyncStorage
    this.setAuthToken(token);
    await AsyncStorage.setItem('token', token);
    
    console.log('Token saved to memory and AsyncStorage');
    
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

  // Ping 相關方法
  async getPings() {
    const response = await this.get('/pings');
    return response.data;
  }

  async createPing(pingData: any) {
    const response = await this.post('/pings', pingData);
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

  // Token 管理方法
  setAuthToken(token: string) {
    this.authToken = token;
  }

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

  clearAuthToken() {
    this.authToken = null;
    AsyncStorage.removeItem('token');
  }
}

// 創建並導出 API 服務實例
export const api = new ApiService();
export default api;