import { api } from './api';
import { Platform } from 'react-native';

// 通知類型定義
export type NotificationType =
  | 'ping_invite'
  | 'ping_accepted'
  | 'ping_declined'
  | 'ping_cancelled'
  | 'friend_request'
  | 'friend_accepted'
  | 'group_invite'
  | 'group_activity'
  | 'bill_created'
  | 'bill_updated'
  | 'bill_paid'
  | 'system';

export interface Notification {
  id: string;
  receiver_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'read' | 'failed';
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  read_at?: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  limit: number;
  offset: number;
  unread_only: boolean;
}

export interface CreateNotificationRequest {
  receiver_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// 通知 API 服務
export const notificationApi = {
  // 獲取用戶通知
  async getNotifications(limit = 20, offset = 0, unreadOnly = false): Promise<GetNotificationsResponse> {
    try {
      const response = await api.get('/notifications', {
        params: { limit, offset, unread_only: unreadOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  },

  // 獲取未讀通知數量
  async getUnreadCount(): Promise<{ unread_count: number }> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  },

  // 標記通知為已讀
  async markAsRead(notificationId: string): Promise<{ message: string; notification_id: string }> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  // 標記所有通知為已讀
  async markAllAsRead(): Promise<{ message: string }> {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  // 創建通知（管理用）
  async createNotification(request: CreateNotificationRequest): Promise<{ message: string }> {
    try {
      const response = await api.post('/notifications', request);
      return response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  },

  // 發送測試通知
  async sendTestNotification(): Promise<{ message: string }> {
    try {
      const response = await api.post('/notifications/test');
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  },

  // 廣播系統通知（管理用）
  async broadcastSystemNotification(title: string, message: string, data?: Record<string, any>): Promise<{ message: string }> {
    try {
      const response = await api.post('/notifications/broadcast', { title, message, data });
      return response.data;
    } catch (error) {
      console.error('Failed to broadcast system notification:', error);
      throw error;
    }
  },

  // 獲取 WebSocket URL
  getWebSocketUrl(): string {
    const baseUrl = Platform.OS === 'web' ? 'localhost:8090' : '192.168.1.100:8090';
    return `ws://${baseUrl}/ws`;
  }
};