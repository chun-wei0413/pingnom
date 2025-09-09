import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootState } from '../store';
import type { DashboardStats, Ping } from '../types/api';
import type { MainTabParamList, GroupDiningStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<GroupDiningStackParamList>
>;

export default function DashboardScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<DashboardNavigationProp>();
  const [stats, setStats] = useState<DashboardStats>({
    totalPings: 0,
    activePings: 0,
    totalFriends: 0,
    pendingRequests: 0,
  });
  const [recentPings, setRecentPings] = useState<Ping[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // 呼叫真實的 Dashboard API
      console.log('Loading dashboard stats from API...');
      const response = await api.getDashboardStats();
      console.log('Dashboard API response:', response);
      
      if (response.success && response.data) {
        setStats({
          totalPings: response.data.total_pings || 0,
          activePings: response.data.active_pings || 0,
          totalFriends: response.data.total_friends || 0,
          pendingRequests: response.data.pending_requests || 0,
        });
      } else {
        // 如果 API 失敗，使用模擬資料作為備選方案
        console.log('API response unsuccessful, using fallback data');
        setStats({
          totalPings: 0,
          activePings: 0,
          totalFriends: 0,
          pendingRequests: 0,
        });
      }
      
      // 載入最近的 Pings 資料
      try {
        const pingsResponse = await api.getPings({ limit: 5 });
        console.log('Recent Pings API response:', pingsResponse);
        if (pingsResponse.success && pingsResponse.data) {
          setRecentPings(pingsResponse.data);
        }
      } catch (pingsError) {
        console.error('載入最近 Pings 失敗:', pingsError);
        // 不顯示錯誤提示，保持默認的空陣列
      }
    } catch (error) {
      console.error('載入 Dashboard 資料失敗:', error);
      
      // 錯誤情況下使用預設值
      setStats({
        totalPings: 0,
        activePings: 0,
        totalFriends: 0,
        pendingRequests: 0,
      });
      
      Alert.alert('提示', '無法載入統計資料，請確認網路連線');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePing = () => {
    navigation.navigate('GroupDining', {
      screen: 'CreatePing'
    });
  };

  const handleQuickPing = async (pingType: 'lunch' | 'dinner', title: string, description: string) => {
    try {
      setIsLoading(true);
      
      // 計算預設時間（午餐：1小時後，晚餐：今晚7點或明天7點）
      const now = new Date();
      let scheduledTime: Date;
      
      if (pingType === 'lunch') {
        scheduledTime = new Date(now.getTime() + 60 * 60 * 1000); // 1小時後
      } else {
        scheduledTime = new Date();
        scheduledTime.setHours(19, 0, 0, 0); // 今晚7點
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1); // 明天7點
        }
      }

      // 獲取好友列表作為預設邀請對象
      const friendsResponse = await api.getFriends();
      let inviteeIds: string[] = [];
      
      if (friendsResponse.friends && friendsResponse.friends.length > 0) {
        // 取前3個好友作為預設邀請對象，從 friendship 中獲取對方的 user ID
        const currentUserId = user?.id;
        inviteeIds = friendsResponse.friends.slice(0, 3).map((friendship: any) => {
          // 如果當前用戶是請求者，返回被請求者ID；否則返回請求者ID
          return friendship.requesterId === currentUserId 
            ? friendship.addresseeId 
            : friendship.requesterId;
        });
      }

      if (inviteeIds.length === 0) {
        Alert.alert('提示', '您還沒有朋友，請先添加朋友再發送快速 Ping');
        return;
      }

      const pingData = {
        title,
        description,
        pingType,
        scheduledAt: scheduledTime.toISOString(),
        invitees: inviteeIds,
      };

      console.log('Creating quick ping:', pingData);
      const response = await api.createPing(pingData);
      
      if (response.data) {
        Alert.alert('成功', `${title}已發送給您的朋友！`);
        // 重新載入 Dashboard 資料
        loadDashboardData();
      } else {
        Alert.alert('錯誤', response.message || '發送失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Quick ping error:', error);
      Alert.alert('錯誤', '網路連線問題，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>歡迎回來！</Text>
            <Text style={styles.userName}>{user?.display_name}</Text>
          </View>
          <TouchableOpacity style={styles.profileImage}>
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPings}</Text>
              <Text style={styles.statLabel}>總 Ping 數</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activePings}</Text>
              <Text style={styles.statLabel}>進行中</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalFriends}</Text>
              <Text style={styles.statLabel}>朋友總數</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
              <Text style={styles.statLabel}>待處理邀請</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          
          {/* Quick Ping 區域 */}
          <View style={styles.quickPingContainer}>
            <Text style={styles.subsectionTitle}>🚀 一鍵發送</Text>
            <View style={styles.quickPingGrid}>
              <TouchableOpacity 
                style={[styles.quickPingCard, styles.lunchCard]}
                onPress={() => handleQuickPing('lunch', '現在吃午餐', '誰要一起吃午餐？')}
                disabled={isLoading}
              >
                <Text style={styles.quickPingIcon}>🥗</Text>
                <Text style={styles.quickPingTitle}>現在午餐</Text>
                <Text style={styles.quickPingTime}>1小時後</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickPingCard, styles.dinnerCard]}
                onPress={() => handleQuickPing('dinner', '今晚聚餐', '今晚一起吃晚餐如何？')}
                disabled={isLoading}
              >
                <Text style={styles.quickPingIcon}>🍜</Text>
                <Text style={styles.quickPingTitle}>今晚聚餐</Text>
                <Text style={styles.quickPingTime}>晚上7點</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 原有操作 */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleCreatePing}>
              <Text style={styles.actionIcon}>🍽️</Text>
              <Text style={styles.actionTitle}>自訂聚餐</Text>
              <Text style={styles.actionSubtitle}>完整設定聚餐內容</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => navigation.navigate('GroupDining', {
                screen: 'RestaurantSearch'
              })}
            >
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionTitle}>搜尋餐廳</Text>
              <Text style={styles.actionSubtitle}>尋找附近美味餐廳</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Pings */}
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>最近的 Ping</Text>
          {recentPings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>還沒有任何 Ping</Text>
              <Text style={styles.emptySubtitle}>開始發起您的第一次聚餐邀請吧！</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreatePing}>
                <Text style={styles.createButtonText}>發起聚餐</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentPings.map((ping) => (
              <TouchableOpacity key={ping.id} style={styles.pingCard}>
                <View style={styles.pingHeader}>
                  <Text style={styles.pingTitle}>{ping.title || '聚餐邀請'}</Text>
                  <View style={[styles.statusBadge, 
                    ping.status === 'pending' ? styles.statusPending : 
                    ping.status === 'accepted' ? styles.statusAccepted : 
                    styles.statusDeclined
                  ]}>
                    <Text style={styles.statusText}>
                      {ping.status === 'pending' ? '等待回應' : 
                       ping.status === 'accepted' ? '已接受' : '已拒絕'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pingDescription}>{ping.description}</Text>
                <View style={styles.pingFooter}>
                  <Text style={styles.pingTime}>
                    📅 {new Date(ping.scheduledAt).toLocaleDateString('zh-TW', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <Text style={styles.pingMeal}>🍽️ {ping.pingType}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  quickPingContainer: {
    marginBottom: 16,
  },
  quickPingGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  quickPingCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lunchCard: {
    backgroundColor: '#fef3c7',
  },
  dinnerCard: {
    backgroundColor: '#ddd6fe',
  },
  quickPingIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickPingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  quickPingTime: {
    fontSize: 10,
    color: '#6b7280',
  },
  actionsGrid: {
    flexDirection: 'row',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  recentContainer: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  pingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  pingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pingTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  pingMeal: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusAccepted: {
    backgroundColor: '#d1fae5',
  },
  statusDeclined: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
});