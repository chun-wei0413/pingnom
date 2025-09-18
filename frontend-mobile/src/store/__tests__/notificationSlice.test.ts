import notificationSlice, {
  addNotification,
  updateUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setConnectionStatus,
  clearError,
  resetNotifications,
  setPagination,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  sendTestNotification,
  NotificationState,
} from '../notificationSlice';
import { configureStore } from '@reduxjs/toolkit';
import { Notification } from '../../services/notificationApi';

// Mock the notificationApi
jest.mock('../../services/notificationApi', () => ({
  notificationApi: {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    sendTestNotification: jest.fn(),
  },
}));

describe('notificationSlice', () => {
  const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    hasMore: true,
    limit: 20,
    offset: 0,
    isConnected: false,
    lastFetched: null,
  };

  describe('reducers', () => {
    it('should handle addNotification', () => {
      const notification: Notification = {
        id: '1',
        receiver_id: 'user1',
        type: 'ping_invite',
        title: 'Test Notification',
        message: 'Test message',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: {},
      };

      const action = addNotification(notification);
      const newState = notificationSlice(initialState, action);

      expect(newState.notifications).toHaveLength(1);
      expect(newState.notifications[0]).toEqual(notification);
      expect(newState.unreadCount).toBe(1);
    });

    it('should not add duplicate notifications', () => {
      const notification: Notification = {
        id: '1',
        receiver_id: 'user1',
        type: 'ping_invite',
        title: 'Test Notification',
        message: 'Test message',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: {},
      };

      const stateWithNotification = {
        ...initialState,
        notifications: [notification],
        unreadCount: 1,
      };

      const action = addNotification(notification);
      const newState = notificationSlice(stateWithNotification, action);

      expect(newState.notifications).toHaveLength(1);
      expect(newState.unreadCount).toBe(1);
    });

    it('should handle updateUnreadCount', () => {
      const action = updateUnreadCount(5);
      const newState = notificationSlice(initialState, action);

      expect(newState.unreadCount).toBe(5);
    });

    it('should handle markNotificationAsRead', () => {
      const notification: Notification = {
        id: '1',
        receiver_id: 'user1',
        type: 'ping_invite',
        title: 'Test Notification',
        message: 'Test message',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: {},
      };

      const stateWithNotification = {
        ...initialState,
        notifications: [notification],
        unreadCount: 1,
      };

      const action = markNotificationAsRead('1');
      const newState = notificationSlice(stateWithNotification, action);

      expect(newState.notifications[0].status).toBe('read');
      expect(newState.notifications[0].read_at).toBeDefined();
      expect(newState.unreadCount).toBe(0);
    });

    it('should handle markAllNotificationsAsRead', () => {
      const notifications: Notification[] = [
        {
          id: '1',
          receiver_id: 'user1',
          type: 'ping_invite',
          title: 'Test Notification 1',
          message: 'Test message 1',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          data: {},
        },
        {
          id: '2',
          receiver_id: 'user1',
          type: 'friend_request',
          title: 'Test Notification 2',
          message: 'Test message 2',
          status: 'sent',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          data: {},
        },
      ];

      const stateWithNotifications = {
        ...initialState,
        notifications,
        unreadCount: 2,
      };

      const action = markAllNotificationsAsRead();
      const newState = notificationSlice(stateWithNotifications, action);

      expect(newState.notifications.every(n => n.status === 'read')).toBe(true);
      expect(newState.notifications.every(n => n.read_at !== undefined)).toBe(true);
      expect(newState.unreadCount).toBe(0);
    });

    it('should handle setConnectionStatus', () => {
      const action = setConnectionStatus(true);
      const newState = notificationSlice(initialState, action);

      expect(newState.isConnected).toBe(true);
    });

    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: 'Test error',
      };

      const action = clearError();
      const newState = notificationSlice(stateWithError, action);

      expect(newState.error).toBeNull();
    });

    it('should handle resetNotifications', () => {
      const stateWithData = {
        ...initialState,
        notifications: [
          {
            id: '1',
            receiver_id: 'user1',
            type: 'ping_invite' as const,
            title: 'Test',
            message: 'Test',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            data: {},
          },
        ],
        offset: 20,
        hasMore: false,
        lastFetched: 123456789,
      };

      const action = resetNotifications();
      const newState = notificationSlice(stateWithData, action);

      expect(newState.notifications).toHaveLength(0);
      expect(newState.offset).toBe(0);
      expect(newState.hasMore).toBe(true);
      expect(newState.lastFetched).toBeNull();
    });

    it('should handle setPagination', () => {
      const action = setPagination({ limit: 10, offset: 5 });
      const newState = notificationSlice(initialState, action);

      expect(newState.limit).toBe(10);
      expect(newState.offset).toBe(5);
    });
  });

  describe('async thunks', () => {
    let store: any;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          notification: notificationSlice,
        },
      });
    });

    it('should handle fetchNotifications.pending', () => {
      const action = { type: fetchNotifications.pending.type };
      const newState = notificationSlice(initialState, action);

      expect(newState.loading).toBe(true);
      expect(newState.error).toBeNull();
    });

    it('should handle fetchNotifications.fulfilled with refresh', () => {
      const notifications: Notification[] = [
        {
          id: '1',
          receiver_id: 'user1',
          type: 'ping_invite',
          title: 'Test',
          message: 'Test',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          data: {},
        },
      ];

      const action = {
        type: fetchNotifications.fulfilled.type,
        payload: {
          notifications,
          limit: 20,
          offset: 0,
          refresh: true,
        },
      };

      const newState = notificationSlice(initialState, action);

      expect(newState.loading).toBe(false);
      expect(newState.notifications).toEqual(notifications);
      expect(newState.offset).toBe(1);
      expect(newState.hasMore).toBe(false); // notifications.length < limit
      expect(newState.lastFetched).toBeDefined();
    });

    it('should handle fetchNotifications.fulfilled with load more', () => {
      const existingNotification: Notification = {
        id: '1',
        receiver_id: 'user1',
        type: 'ping_invite',
        title: 'Existing',
        message: 'Existing',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: {},
      };

      const newNotification: Notification = {
        id: '2',
        receiver_id: 'user1',
        type: 'friend_request',
        title: 'New',
        message: 'New',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: {},
      };

      const stateWithNotifications = {
        ...initialState,
        notifications: [existingNotification],
        offset: 1,
      };

      const action = {
        type: fetchNotifications.fulfilled.type,
        payload: {
          notifications: [newNotification],
          limit: 20,
          offset: 1,
          refresh: false,
        },
      };

      const newState = notificationSlice(stateWithNotifications, action);

      expect(newState.loading).toBe(false);
      expect(newState.notifications).toHaveLength(2);
      expect(newState.notifications[0]).toEqual(existingNotification);
      expect(newState.notifications[1]).toEqual(newNotification);
      expect(newState.offset).toBe(2);
    });

    it('should handle fetchNotifications.rejected', () => {
      const action = {
        type: fetchNotifications.rejected.type,
        error: { message: 'Network error' },
      };

      const newState = notificationSlice(initialState, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe('Network error');
    });

    it('should handle fetchUnreadCount.fulfilled', () => {
      const action = {
        type: fetchUnreadCount.fulfilled.type,
        payload: 5,
      };

      const newState = notificationSlice(initialState, action);

      expect(newState.unreadCount).toBe(5);
    });

    it('should handle markAsRead.fulfilled', () => {
      const notification: Notification = {
        id: '1',
        receiver_id: 'user1',
        type: 'ping_invite',
        title: 'Test',
        message: 'Test',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: {},
      };

      const stateWithNotification = {
        ...initialState,
        notifications: [notification],
        unreadCount: 1,
      };

      const action = {
        type: markAsRead.fulfilled.type,
        payload: '1',
      };

      const newState = notificationSlice(stateWithNotification, action);

      expect(newState.notifications[0].status).toBe('read');
      expect(newState.unreadCount).toBe(0);
    });

    it('should handle markAllAsRead.fulfilled', () => {
      const notifications: Notification[] = [
        {
          id: '1',
          receiver_id: 'user1',
          type: 'ping_invite',
          title: 'Test 1',
          message: 'Test 1',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          data: {},
        },
        {
          id: '2',
          receiver_id: 'user1',
          type: 'friend_request',
          title: 'Test 2',
          message: 'Test 2',
          status: 'sent',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          data: {},
        },
      ];

      const stateWithNotifications = {
        ...initialState,
        notifications,
        unreadCount: 2,
      };

      const action = {
        type: markAllAsRead.fulfilled.type,
        payload: true,
      };

      const newState = notificationSlice(stateWithNotifications, action);

      expect(newState.notifications.every(n => n.status === 'read')).toBe(true);
      expect(newState.unreadCount).toBe(0);
    });
  });
});