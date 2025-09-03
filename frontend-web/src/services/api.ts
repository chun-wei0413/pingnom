import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Friend,
  FriendRequest,
  GroupDiningPlan,
  Vote,
  VotingResults,
  ApiResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8090/api/v1',
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

  // 認證相關
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  // 朋友相關
  async searchUsers(query: string): Promise<User[]> {
    const response = await this.api.get<User[]>(`/friends/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getFriends(): Promise<Friend[]> {
    const response = await this.api.get<Friend[]>('/friends');
    return response.data;
  }

  async sendFriendRequest(userId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>('/friends/request', {
      to_user_id: userId
    });
    return response.data;
  }

  async getPendingRequests(): Promise<FriendRequest[]> {
    const response = await this.api.get<FriendRequest[]>('/friends/requests');
    return response.data;
  }

  async acceptFriendRequest(requestId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(`/friends/requests/${requestId}/accept`);
    return response.data;
  }

  async rejectFriendRequest(requestId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post<ApiResponse<any>>(`/friends/requests/${requestId}/reject`);
    return response.data;
  }

  // 群組聚餐相關
  async createGroupDiningPlan(data: {
    created_by: string;
    title: string;
    description: string;
  }): Promise<GroupDiningPlan> {
    const response = await this.api.post<GroupDiningPlan>('/group-dining/plans', data);
    return response.data;
  }

  async getGroupDiningPlan(planId: string): Promise<GroupDiningPlan> {
    const response = await this.api.get<GroupDiningPlan>(`/group-dining/plans/${planId}`);
    return response.data;
  }

  async getMyPlans(): Promise<{ plans: GroupDiningPlan[] }> {
    const response = await this.api.get<{ plans: GroupDiningPlan[] }>('/group-dining/plans');
    return response.data;
  }

  async getParticipatingPlans(): Promise<{ plans: GroupDiningPlan[] }> {
    const response = await this.api.get<{ plans: GroupDiningPlan[] }>('/group-dining/participants/plans');
    return response.data;
  }

  async addTimeSlot(planId: string, data: {
    start_time: string;
    end_time: string;
    description: string;
  }): Promise<GroupDiningPlan> {
    const response = await this.api.post<GroupDiningPlan>(`/group-dining/plans/${planId}/time-slots`, data);
    return response.data;
  }

  async addRestaurantOption(planId: string, data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    cuisine_type: string;
  }): Promise<GroupDiningPlan> {
    const response = await this.api.post<GroupDiningPlan>(`/group-dining/plans/${planId}/restaurants`, data);
    return response.data;
  }

  async joinPlan(planId: string, data: {
    user_id: string;
    display_name: string;
  }): Promise<GroupDiningPlan> {
    const response = await this.api.post<GroupDiningPlan>(`/group-dining/plans/${planId}/join`, data);
    return response.data;
  }

  async startVoting(planId: string, data?: {
    voting_deadline?: string;
  }): Promise<GroupDiningPlan> {
    const response = await this.api.post<GroupDiningPlan>(`/group-dining/plans/${planId}/start-voting`, data || {});
    return response.data;
  }

  async submitVote(planId: string, data: {
    user_id: string;
    time_slot_ids: string[];
    restaurant_ids: string[];
    comment?: string;
  }): Promise<Vote> {
    const response = await this.api.post<Vote>(`/group-dining/plans/${planId}/vote`, data);
    return response.data;
  }

  async getVotingResults(planId: string): Promise<VotingResults> {
    const response = await this.api.get<VotingResults>(`/group-dining/plans/${planId}/results`);
    return response.data;
  }

  async finalizePlan(planId: string, data: {
    time_slot_id: string;
    restaurant_id: string;
  }): Promise<GroupDiningPlan> {
    const response = await this.api.post<GroupDiningPlan>(`/group-dining/plans/${planId}/finalize`, data);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;