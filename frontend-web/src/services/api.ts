import axios from 'axios';
import type { AxiosInstance } from 'axios';

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
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 回應攔截器 - 處理錯誤
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
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
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    // 適配後端回應格式到前端期待的格式
    const backendData = response.data.data;
    return {
      token: backendData.accessToken,
      user: {
        id: '', // 暫時空白，之後可以從 JWT token 解析
        email: email, // 使用輸入的 email
        display_name: backendData.user.displayName
      }
    };
  }

  async register(email: string, password: string, displayName: string) {
    const response = await this.post('/users/register', { 
      email, 
      password, 
      display_name: displayName 
    });
    return response.data; // 返回實際的數據
  }
}

// 創建並導出 API 服務實例
export const api = new ApiService();
export default api;