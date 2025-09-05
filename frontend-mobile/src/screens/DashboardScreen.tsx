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
import type { RootState } from '../store';
import type { DashboardStats, Ping } from '../types/api';
import { api } from '../services/api';

export default function DashboardScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
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
      
      // 暫時使用模擬資料，因為後端 API 可能還不完整
      setStats({
        totalPings: 12,
        activePings: 3,
        totalFriends: 8,
        pendingRequests: 2,
      });
      
      setRecentPings([]);
    } catch (error) {
      console.error('載入 Dashboard 資料失敗:', error);
      Alert.alert('錯誤', '載入資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePing = () => {
    Alert.alert('功能開發中', 'Ping 創建功能正在開發中...');
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
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleCreatePing}>
              <Text style={styles.actionIcon}>🍽️</Text>
              <Text style={styles.actionTitle}>發起聚餐</Text>
              <Text style={styles.actionSubtitle}>邀請朋友一起用餐</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionTitle}>管理朋友</Text>
              <Text style={styles.actionSubtitle}>查看和管理朋友清單</Text>
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
              <View key={ping.id} style={styles.pingCard}>
                <Text style={styles.pingTitle}>{ping.title}</Text>
                <Text style={styles.pingDescription}>{ping.description}</Text>
              </View>
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
  pingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});