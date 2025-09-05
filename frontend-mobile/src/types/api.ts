// API 相關類型定義

// 基礎回應類型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 用戶相關
export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 朋友相關
export interface Friend {
  id: string;
  display_name: string;
  email: string;
  friendship_status?: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Ping 相關
export interface Ping {
  id: string;
  created_by: string;
  title: string;
  description: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduled_time?: string;
  invitee_ids: string[];
  responses: PingResponse[];
  status: 'active' | 'responded' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PingResponse {
  user_id: string;
  user_name: string;
  response: 'accept' | 'decline' | 'maybe';
  responded_at: string;
}

export interface CreatePingRequest {
  title: string;
  description: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduled_time?: string;
  invitee_ids: string[];
}

// 統計相關
export interface DashboardStats {
  totalPings: number;
  activePings: number;
  totalFriends: number;
  pendingRequests: number;
}