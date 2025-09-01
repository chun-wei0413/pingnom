import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api';

// Ping types
export interface PingRequest {
  title: string;
  description?: string;
  pingType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduledAt: string; // ISO format
  invitees: string[]; // User IDs
}

export interface PingResponse {
  userId: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string;
  respondedAt?: string;
}

export interface Ping {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  pingType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  status: 'active' | 'cancelled' | 'completed' | 'expired';
  scheduledAt: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  responses: PingResponse[];
  inviteeCount: number;
  acceptedCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePingResult {
  pingId: string;
  title: string;
  pingType: string;
  scheduledAt: string;
  inviteeCount: number;
  createdAt: string;
}

export interface RespondToPingRequest {
  status: 'accepted' | 'declined';
  message?: string;
}

export interface GetUserPingsResult {
  pings: Ping[];
  total: number;
}

export class PingApi {
  // Create a new ping
  public async createPing(data: PingRequest): Promise<CreatePingResult> {
    const response = await apiClient.post<{data: CreatePingResult, message: string}>('/pings/', data);
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.error || 'Failed to create ping');
  }

  // Respond to a ping
  public async respondToPing(pingId: string, data: RespondToPingRequest): Promise<void> {
    const response = await apiClient.put(`/pings/${pingId}/respond`, data);
    if (response.error) {
      throw new Error(response.error);
    }
  }

  // Get user's pings
  public async getUserPings(limit: number = 20, offset: number = 0): Promise<GetUserPingsResult> {
    const params = { limit, offset };
    const response = await apiClient.get<GetUserPingsResult>('/pings/', params);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch pings');
  }

  // Get ping by ID
  public async getPingById(pingId: string): Promise<Ping> {
    const response = await apiClient.get<Ping>(`/pings/${pingId}`);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch ping');
  }
}

export const pingApi = new PingApi();
export default pingApi;