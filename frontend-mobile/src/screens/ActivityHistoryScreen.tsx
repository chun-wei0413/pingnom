import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootState } from '../store';
import type { ActivityHistory } from '../types/api';
import { api } from '../services/api';

type ActivityHistoryNavigationProp = StackNavigationProp<any>;

export default function ActivityHistoryScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<ActivityHistoryNavigationProp>();
  const [activities, setActivities] = useState<ActivityHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  // 當畫面聚焦時載入資料
  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [selectedFilter])
  );

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      console.log('Loading activities with filter:', selectedFilter);

      const params = selectedFilter === 'all' ? {} : { status: selectedFilter as 'pending' | 'completed' | 'cancelled' };
      const response = await api.getUserActivityHistory(params);
      console.log('Activities API response:', response);

      if (response && response.data && response.data.activities) {
        setActivities(response.data.activities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert('錯誤', '載入活動歷史失敗，請稍後再試');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  }, [selectedFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // amber
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'pending':
        return '進行中';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderActivity = (activity: ActivityHistory) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.activityCard}
      onPress={() => {
        navigation.navigate('ActivityDetail', { activityId: activity.id });
      }}
    >
      <View style={styles.activityHeader}>
        <Text style={styles.restaurantName}>{activity.restaurantName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) }]}>
          <Text style={styles.statusText}>{getStatusText(activity.status)}</Text>
        </View>
      </View>

      <View style={styles.activityDetails}>
        <Text style={styles.attendedDate}>用餐時間：{formatDate(activity.attendedAt)}</Text>
        <Text style={styles.participants}>參與人數：{activity.participants} 人</Text>
        {activity.notes && (
          <Text style={styles.notes} numberOfLines={2}>備註：{activity.notes}</Text>
        )}
      </View>

      <Text style={styles.createdDate}>建立於 {formatDate(activity.createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>活動歷史</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate('CreateActivity');
          }}
        >
          <Text style={styles.addButtonText}>+ 新增</Text>
        </TouchableOpacity>
      </View>

      {/* 篩選按鈕 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '進行中' },
            { key: 'completed', label: '已完成' },
            { key: 'cancelled', label: '已取消' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 活動列表 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>尚無活動歷史</Text>
            <Text style={styles.emptySubtext}>開始記錄您的用餐體驗吧！</Text>
          </View>
        ) : (
          activities.map(renderActivity)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  activityCard: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activityDetails: {
    marginBottom: 8,
  },
  attendedDate: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  participants: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});