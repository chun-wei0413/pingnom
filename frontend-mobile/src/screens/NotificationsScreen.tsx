import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store/store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  sendTestNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
  selectNotificationError,
  selectNotificationConnection,
  clearError,
  resetNotifications,
} from '../store/notificationSlice';
import { Notification } from '../services/notificationApi';

const NotificationsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationLoading);
  const error = useSelector(selectNotificationError);
  const isConnected = useSelector(selectNotificationConnection);

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // 載入通知
  const loadNotifications = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        dispatch(resetNotifications());
      }

      await dispatch(fetchNotifications({
        limit: 20,
        offset: refresh ? 0 : notifications.length,
        unreadOnly: activeTab === 'unread',
        refresh,
      })).unwrap();

      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [dispatch, activeTab, notifications.length]);

  // 初始載入
  useEffect(() => {
    loadNotifications(true);
  }, [activeTab]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications(true);
    setRefreshing(false);
  }, [loadNotifications]);

  // 標記通知為已讀
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      Alert.alert('錯誤', '標記已讀失敗');
    }
  }, [dispatch]);

  // 標記所有為已讀
  const handleMarkAllAsRead = useCallback(async () => {
    Alert.alert(
      '確認',
      '確定要將所有通知標記為已讀嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            try {
              await dispatch(markAllAsRead()).unwrap();
              Alert.alert('成功', '已將所有通知標記為已讀');
            } catch (error) {
              Alert.alert('錯誤', '標記所有已讀失敗');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  // 發送測試通知
  const handleSendTestNotification = useCallback(async () => {
    try {
      await dispatch(sendTestNotification()).unwrap();
      Alert.alert('成功', '測試通知已發送');
    } catch (error) {
      Alert.alert('錯誤', '發送測試通知失敗');
    }
  }, [dispatch]);

  // 清除錯誤
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 獲取通知圖標
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'ping_invite': return '🍽️';
      case 'ping_accepted': return '✅';
      case 'ping_declined': return '❌';
      case 'friend_request': return '👤';
      case 'friend_accepted': return '🤝';
      case 'bill_created': return '💰';
      case 'bill_updated': return '📝';
      case 'group_invite': return '👥';
      case 'system': return '🔔';
      default: return '📮';
    }
  };

  // 格式化時間
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '剛剛';
    if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} 小時前`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} 天前`;

    return date.toLocaleDateString('zh-TW');
  };

  // 渲染通知項目
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const isUnread = item.status === 'pending' || item.status === 'sent';

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.unreadItem]}
        onPress={() => isUnread && handleMarkAsRead(item.id)}
      >
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </Text>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isUnread && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(item.created_at)}
            </Text>
          </View>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  // 顯示錯誤
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>錯誤：{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleClearError}>
          <Text style={styles.retryButtonText}>重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 標題列 */}
      <View style={styles.header}>
        <Text style={styles.title}>通知</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendTestNotification}
          >
            <Text style={styles.actionButtonText}>測試</Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.actionButtonText}>全部已讀</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 連接狀態 */}
      <View style={styles.statusBar}>
        <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4ade80' : '#ef4444' }]} />
        <Text style={styles.statusText}>
          {isConnected ? '已連接' : '未連接'} | 未讀：{unreadCount}
        </Text>
      </View>

      {/* 分頁標籤 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            全部通知
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            未讀通知 ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 通知列表 */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => loadNotifications()}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'unread' ? '沒有未讀通知' : '沒有通知'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadItem: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NotificationsScreen;