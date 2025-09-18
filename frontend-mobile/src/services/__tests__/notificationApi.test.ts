import { notificationApi, NotificationType } from '../notificationApi';
import { api } from '../api';

// Mock the api module
jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe('notificationApi', () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications with default parameters', async () => {
      const mockResponse = {
        data: {
          notifications: [
            {
              id: '1',
              receiver_id: 'user1',
              type: 'ping_invite' as NotificationType,
              title: 'Test Notification',
              message: 'Test message',
              status: 'pending',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          limit: 20,
          offset: 0,
          unread_only: false,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.getNotifications();

      expect(mockApi.get).toHaveBeenCalledWith('/notifications', {
        params: { limit: 20, offset: 0, unread_only: false },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch notifications with custom parameters', async () => {
      const mockResponse = {
        data: {
          notifications: [],
          limit: 10,
          offset: 5,
          unread_only: true,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.getNotifications(10, 5, true);

      expect(mockApi.get).toHaveBeenCalledWith('/notifications', {
        params: { limit: 10, offset: 5, unread_only: true },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.get.mockRejectedValueOnce(mockError);

      await expect(notificationApi.getNotifications()).rejects.toThrow('Network error');
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread count', async () => {
      const mockResponse = {
        data: { unread_count: 5 },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.getUnreadCount();

      expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.get.mockRejectedValueOnce(mockError);

      await expect(notificationApi.getUnreadCount()).rejects.toThrow('Network error');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notification-123';
      const mockResponse = {
        data: {
          message: '已標記為已讀',
          notification_id: notificationId,
        },
      };

      mockApi.put.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.markAsRead(notificationId);

      expect(mockApi.put).toHaveBeenCalledWith(`/notifications/${notificationId}/read`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.put.mockRejectedValueOnce(mockError);

      await expect(notificationApi.markAsRead('123')).rejects.toThrow('Network error');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResponse = {
        data: { message: '已標記所有通知為已讀' },
      };

      mockApi.put.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.markAllAsRead();

      expect(mockApi.put).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.put.mockRejectedValueOnce(mockError);

      await expect(notificationApi.markAllAsRead()).rejects.toThrow('Network error');
    });
  });

  describe('createNotification', () => {
    it('should create notification', async () => {
      const request = {
        receiver_id: 'user-123',
        type: 'ping_invite' as NotificationType,
        title: 'Test Notification',
        message: 'Test message',
        data: { ping_id: 'ping-123' },
      };

      const mockResponse = {
        data: { message: '通知創建成功' },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.createNotification(request);

      expect(mockApi.post).toHaveBeenCalledWith('/notifications', request);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const request = {
        receiver_id: 'user-123',
        type: 'ping_invite' as NotificationType,
        title: 'Test Notification',
        message: 'Test message',
      };

      const mockError = new Error('Network error');
      mockApi.post.mockRejectedValueOnce(mockError);

      await expect(notificationApi.createNotification(request)).rejects.toThrow('Network error');
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification', async () => {
      const mockResponse = {
        data: { message: '測試通知已發送' },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.sendTestNotification();

      expect(mockApi.post).toHaveBeenCalledWith('/notifications/test');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.post.mockRejectedValueOnce(mockError);

      await expect(notificationApi.sendTestNotification()).rejects.toThrow('Network error');
    });
  });

  describe('broadcastSystemNotification', () => {
    it('should broadcast system notification', async () => {
      const title = 'System Maintenance';
      const message = 'Maintenance in progress';
      const data = { duration: '2 hours' };

      const mockResponse = {
        data: { message: '系統通知廣播成功' },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await notificationApi.broadcastSystemNotification(title, message, data);

      expect(mockApi.post).toHaveBeenCalledWith('/notifications/broadcast', {
        title,
        message,
        data,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApi.post.mockRejectedValueOnce(mockError);

      await expect(
        notificationApi.broadcastSystemNotification('Title', 'Message')
      ).rejects.toThrow('Network error');
    });
  });

  describe('getWebSocketUrl', () => {
    it('should return correct WebSocket URL for web platform', () => {
      // Mock Platform.OS
      jest.doMock('react-native', () => ({
        Platform: { OS: 'web' },
      }));

      // Re-import to get the mocked Platform
      const { notificationApi: webNotificationApi } = require('../notificationApi');

      const url = webNotificationApi.getWebSocketUrl();
      expect(url).toBe('ws://localhost:8090/ws');
    });

    // Note: Testing mobile platform requires more complex setup
    // due to React Native's Platform detection
  });
});