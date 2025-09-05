import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/api';

// API 服務類別
export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 請求攔截器 - 添加 JWT token
    this.api.interceptors.request.use((config) => {
      // 在 React Native 中，我們需要使用 AsyncStorage 來儲存 token
      // 暫時先不處理，等等再實作
      return config;
    });

    // 回應攔截器 - 處理錯誤
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 清除 token 並跳轉到登入頁面
          // 在 React Native 中需要使用不同的方式處理
        }
        return Promise.reject(error);
      }
    );
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
    return {
      token: backendData.accessToken,
      user: {
        id: '', // 暫時空白，之後可以從 JWT token 解析
        email: email, // 使用輸入的 email
        display_name: backendData.user.displayName,
        created_at: new Date().toISOString(),
      }
    };
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
    const response = await this.get('/friends');
    return response.data;
  }

  async sendFriendRequest(email: string) {
    const response = await this.post('/friends/request', { email });
    return response.data;
  }

  async respondToFriendRequest(requestId: string, action: 'accept' | 'decline') {
    const response = await this.put(`/friends/request/${requestId}/${action}`);
    return response.data;
  }
}

// 創建並導出 API 服務實例
export const api = new ApiService();
export default api;