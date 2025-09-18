import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, notificationApi } from '../services/notificationApi';

// 通知狀態介面
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  limit: number;
  offset: number;
  isConnected: boolean;
  lastFetched: number | null;
}

// 初始狀態
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

// 異步 Thunk：獲取通知
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params: { limit?: number; offset?: number; unreadOnly?: boolean; refresh?: boolean } = {}) => {
    const { limit = 20, offset = 0, unreadOnly = false } = params;
    const response = await notificationApi.getNotifications(limit, offset, unreadOnly);
    return { ...response, refresh: params.refresh };
  }
);

// 異步 Thunk：獲取未讀數量
export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async () => {
    const response = await notificationApi.getUnreadCount();
    return response.unread_count;
  }
);

// 異步 Thunk：標記為已讀
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string) => {
    await notificationApi.markAsRead(notificationId);
    return notificationId;
  }
);

// 異步 Thunk：標記所有為已讀
export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async () => {
    await notificationApi.markAllAsRead();
    return true;
  }
);

// 異步 Thunk：發送測試通知
export const sendTestNotification = createAsyncThunk(
  'notification/sendTestNotification',
  async () => {
    const response = await notificationApi.sendTestNotification();
    return response.message;
  }
);

// 通知 Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // 添加新通知（WebSocket）
    addNotification: (state, action: PayloadAction<Notification>) => {
      const notification = action.payload;

      // 檢查是否已存在（避免重複）
      const exists = state.notifications.find(n => n.id === notification.id);
      if (!exists) {
        state.notifications.unshift(notification);

        // 如果是未讀通知，增加未讀數量
        if (notification.status === 'pending' || notification.status === 'sent') {
          state.unreadCount += 1;
        }
      }
    },

    // 更新未讀數量（WebSocket）
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    // 標記單個通知為已讀（本地）
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);

      if (notification && (notification.status === 'pending' || notification.status === 'sent')) {
        notification.status = 'read';
        notification.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    // 標記所有通知為已讀（本地）
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (notification.status === 'pending' || notification.status === 'sent') {
          notification.status = 'read';
          notification.read_at = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },

    // 設置 WebSocket 連接狀態
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    // 清除錯誤
    clearError: (state) => {
      state.error = null;
    },

    // 重置狀態
    resetNotifications: (state) => {
      state.notifications = [];
      state.offset = 0;
      state.hasMore = true;
      state.lastFetched = null;
    },

    // 設置分頁參數
    setPagination: (state, action: PayloadAction<{ limit?: number; offset?: number }>) => {
      const { limit, offset } = action.payload;
      if (limit !== undefined) state.limit = limit;
      if (offset !== undefined) state.offset = offset;
    },
  },
  extraReducers: (builder) => {
    builder
      // 獲取通知
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, limit, offset, refresh } = action.payload;

        if (refresh || offset === 0) {
          // 刷新或首次加載
          state.notifications = notifications;
          state.offset = notifications.length;
        } else {
          // 加載更多
          state.notifications.push(...notifications);
          state.offset += notifications.length;
        }

        state.hasMore = notifications.length === limit;
        state.lastFetched = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '獲取通知失敗';
      })

      // 獲取未讀數量
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.error = action.error.message || '獲取未讀數量失敗';
      })

      // 標記為已讀
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);

        if (notification && (notification.status === 'pending' || notification.status === 'sent')) {
          notification.status = 'read';
          notification.read_at = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.error.message || '標記已讀失敗';
      })

      // 標記所有為已讀
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          if (notification.status === 'pending' || notification.status === 'sent') {
            notification.status = 'read';
            notification.read_at = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.error = action.error.message || '標記所有已讀失敗';
      })

      // 發送測試通知
      .addCase(sendTestNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '發送測試通知失敗';
      });
  },
});

// 導出 actions
export const {
  addNotification,
  updateUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setConnectionStatus,
  clearError,
  resetNotifications,
  setPagination,
} = notificationSlice.actions;

// 選擇器
export const selectNotifications = (state: { notification: NotificationState }) => state.notification.notifications;
export const selectUnreadCount = (state: { notification: NotificationState }) => state.notification.unreadCount;
export const selectNotificationLoading = (state: { notification: NotificationState }) => state.notification.loading;
export const selectNotificationError = (state: { notification: NotificationState }) => state.notification.error;
export const selectNotificationConnection = (state: { notification: NotificationState }) => state.notification.isConnected;
export const selectUnreadNotifications = (state: { notification: NotificationState }) =>
  state.notification.notifications.filter(n => n.status === 'pending' || n.status === 'sent');

// 導出 reducer
export default notificationSlice.reducer;